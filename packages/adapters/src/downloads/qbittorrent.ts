import { readSettings } from '@gamearr/shared';

interface QbConfig {
  baseUrl: string;
  username: string;
  password: string;
}

let lastBaseUrl: string | undefined;

const DEFAULT_BASE_URL = 'http://localhost:8080';
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'adminadmin';

async function getConfig(): Promise<QbConfig> {
  const settings = await readSettings();
  const qb = settings.downloads.qbittorrent;
  return {
    baseUrl: qb.baseUrl || DEFAULT_BASE_URL,
    username: qb.username || DEFAULT_USERNAME,
    password: qb.password || DEFAULT_PASSWORD,
  };
}

let cookie: string | undefined;

async function login(baseUrl: string, username: string, password: string) {
  const url = new URL('/api/v2/auth/login', baseUrl);
  const body = new URLSearchParams({ username, password });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(
      `qbittorrent login failed: ${res.status} ${text} (url: ${url})`,
    );
  }
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error(
      `qbittorrent login failed: ${text || 'missing cookie'} (url: ${url})`,
    );
  }
  cookie = setCookie.split(';')[0];
}

async function qbFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const { baseUrl, username, password } = await getConfig();
  if (baseUrl !== lastBaseUrl) {
    cookie = undefined;
    lastBaseUrl = baseUrl;
  }
  const url = new URL(`/api/v2${path}`, baseUrl);
  const headers = new Headers(init.headers);
  if (cookie) headers.set('cookie', cookie);
  const res = await fetch(url, { ...init, headers });
  if (res.status === 403 && retry) {
    await login(baseUrl, username, password);
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
