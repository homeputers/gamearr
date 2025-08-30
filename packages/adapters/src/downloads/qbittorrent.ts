export interface QbitConfig {
  baseURL: string;
  username: string;
  password: string;
  category?: string;
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

export class QbitClient {
  private readonly baseURL: string;
  private readonly username: string;
  private readonly password: string;
  private readonly category: string;
  private cookie?: string;
  private csrf?: string;

  constructor(config: QbitConfig) {
    this.baseURL = config.baseURL;
    this.username = config.username;
    this.password = config.password;
    this.category = config.category ?? 'gamearr';
  }

  async login(): Promise<void> {
    const url = new URL('/api/v2/auth/login', this.baseURL);
    const body = new URLSearchParams({
      username: this.username,
      password: this.password,
    });
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error(`qbittorrent login failed: ${res.status} ${text}`);
    }
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) {
      throw new Error(`qbittorrent login failed: ${text || 'missing cookie'}`);
    }
    const cookieParts: string[] = [];
    for (const part of setCookie.split(',')) {
      const trimmed = part.trim();
      const first = trimmed.split(';')[0];
      const [name, value] = first.split('=');
      if (/csrf/i.test(name)) {
        this.csrf = value;
      }
      cookieParts.push(first);
    }
    this.cookie = cookieParts.join('; ');
  }

  private async qbFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
    const url = new URL(`/api/v2${path}`, this.baseURL);
    const headers = new Headers(init.headers);
    headers.set('Referer', this.baseURL);
    if (this.cookie) headers.set('Cookie', this.cookie);
    if (this.csrf) headers.set('X-CSRF-Token', this.csrf);
    const res = await fetch(url.toString(), { ...init, headers });
    if (res.status === 403 && retry) {
      await this.login();
      return this.qbFetch(path, init, false);
    }
    return res;
  }

  async addMagnet(magnet: string, opts: { category?: string } = {}): Promise<number> {
    const body = new URLSearchParams({
      urls: magnet,
      category: opts.category || this.category,
    });
    const res = await this.qbFetch('/torrents/add', { method: 'POST', body });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`qbittorrent add failed: ${res.status} ${text}`);
    }
    return res.status;
  }

  async listTorrents(opts: { category?: string } = {}): Promise<TorrentInfo[]> {
    const category = opts.category || this.category;
    const res = await this.qbFetch(`/torrents/info?category=${encodeURIComponent(category)}`);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`qbittorrent list failed: ${res.status} ${text}`);
    }
    return res.json();
  }

  async getTorrent(hash: string): Promise<TorrentInfo | undefined> {
    const res = await this.qbFetch(`/torrents/info?hashes=${hash}`);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`qbittorrent get failed: ${res.status} ${text}`);
    }
    const arr: TorrentInfo[] = await res.json();
    return arr[0];
  }

  async pauseTorrent(hash: string): Promise<number> {
    const body = new URLSearchParams({ hashes: hash });
    const res = await this.qbFetch('/torrents/pause', { method: 'POST', body });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`qbittorrent pause failed: ${res.status} ${text}`);
    }
    return res.status;
  }

  async resumeTorrent(hash: string): Promise<number> {
    const body = new URLSearchParams({ hashes: hash });
    const res = await this.qbFetch('/torrents/resume', { method: 'POST', body });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`qbittorrent resume failed: ${res.status} ${text}`);
    }
    return res.status;
  }

  async removeTorrent(hash: string, opts: { deleteFiles?: boolean } = {}): Promise<number> {
    const body = new URLSearchParams({
      hashes: hash,
      deleteFiles: String(!!opts.deleteFiles),
    });
    const res = await this.qbFetch('/torrents/delete', { method: 'POST', body });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`qbittorrent remove failed: ${res.status} ${text}`);
    }
    return res.status;
  }
}
