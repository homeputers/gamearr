import { config } from '@gamearr/shared';

const BASE_URL = config.qbittorrent?.url || 'http://localhost:8080';
const USERNAME = config.qbittorrent?.username || 'admin';
const PASSWORD = config.qbittorrent?.password || 'adminadmin';

let cookie: string | undefined;

async function login() {
  const url = new URL('/api/v2/auth/login', BASE_URL);
  const body = new URLSearchParams({ username: USERNAME, password: PASSWORD });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`qbittorrent login failed: ${res.status} ${text}`);
  }
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('qbittorrent login missing cookie');
  }
  cookie = setCookie.split(';')[0];
}

async function qbFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const url = new URL(`/api/v2${path}`, BASE_URL);
  const headers = new Headers(init.headers);
  if (cookie) headers.set('cookie', cookie);
  const res = await fetch(url, { ...init, headers });
  if (res.status === 403 && retry) {
    await login();
    return qbFetch(path, init, false);
  }
  return res;
}

export async function addMagnet(magnet: string) {
  const body = new URLSearchParams({ urls: magnet, category: 'gamearr' });
  const res = await qbFetch('/torrents/add', {
    method: 'POST',
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`qbittorrent add failed: ${res.status} ${text}`);
  }
}

export interface TorrentInfo {
  hash: string;
  name: string;
  state: string;
  progress: number;
  dlspeed: number;
  eta: number;
  save_path?: string;
  content_path?: string;
}

export async function getStatus(): Promise<TorrentInfo[]> {
  const res = await qbFetch('/torrents/info?category=gamearr');
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`qbittorrent status failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function pause(hash: string) {
  await qbFetch(`/torrents/pause?hashes=${hash}`, { method: 'POST' });
}

export async function resume(hash: string) {
  await qbFetch(`/torrents/resume?hashes=${hash}`, { method: 'POST' });
}

export async function remove(hash: string) {
  await qbFetch(`/torrents/delete?hashes=${hash}&deleteFiles=false`, { method: 'POST' });
}
