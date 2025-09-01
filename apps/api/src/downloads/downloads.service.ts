import { Injectable, Inject } from '@nestjs/common';
import { QbitClient } from '@gamearr/adapters';
import { getIndexer } from '@gamearr/domain';
import { readSettings } from '@gamearr/shared';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DownloadsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async getClient() {
    const settings = await readSettings();
    const qb = settings.downloads.qbittorrent;
    if (!qb.baseUrl || !qb.username || !qb.password) {
      throw new Error('qbittorrent not configured');
    }
    return new QbitClient({
      baseURL: qb.baseUrl,
      username: qb.username,
      password: qb.password,
      category: qb.category,
    });
  }

  async addMagnet(
    magnet: string,
    category?: string,
    extra: Record<string, unknown> = {},
  ) {
    const client = await this.getClient();
    await client.addMagnet(magnet, { category });
    const hashMatch = magnet.match(/btih:([^&]+)/i);
    const hash = hashMatch ? hashMatch[1] : undefined;
    return this.prisma.download.create({
      data: {
        state: 'queued',
        client: 'qbit',
        payload: { magnet, hash, category, ...extra },
      },
    });
  }

  async addFromSearch(opts: {
    indexerKey: string;
    id?: string;
    link?: string;
    category?: string;
  }) {
    const { indexerKey, id, link, category } = opts;
    let url = link;
    if (!url || !url.startsWith('magnet:')) {
      const indexer = getIndexer(indexerKey);
      if (!indexer) {
        throw new Error('Indexer not found');
      }
      if (!id) {
        throw new Error('id required');
      }
      if (!indexer.getById) {
        throw new Error('Indexer does not support getById');
      }
      const res = await indexer.getById(id);
      if (!res) {
        throw new Error('Result not found');
      }
      if (res.link) {
        url = res.link;
      } else if (res.infoHash) {
        url = `magnet:?xt=urn:btih:${res.infoHash}`;
      }
    }
    if (!url) {
      throw new Error('No download link available');
    }
    return this.addMagnet(url, category, { indexerKey, id });
  }

  async list() {
    const client = await this.getClient();
    const torrents = await client.listTorrents();
    const downloads = await this.prisma.download.findMany();
    const map = new Map(torrents.map((t) => [t.hash, t]));
    return downloads.map((d: any) => {
      const payload = (d.payload as any) || {};
      const torrent = payload.hash ? map.get(payload.hash) : undefined;
      return {
        id: d.id,
        client: d.client,
        state: torrent?.state ?? d.state,
        hash: payload.hash,
        name: torrent?.name,
        progress: torrent?.progress,
        dlspeed: torrent?.dlspeed,
        eta: torrent?.eta,
      };
    });
  }

  async pause(id: string) {
    const existing = await this.prisma.download.findUnique({ where: { id } });
    if (!existing) return null;
    const payload = (existing.payload as any) || {};
    const hash = payload.hash as string | undefined;
    if (hash) {
      try {
        const client = await this.getClient();
        await client.pauseTorrent(hash);
      } catch {
        // ignore errors from download client
      }
    }
    await this.prisma.download.update({ where: { id }, data: { state: 'paused' } });
    return { status: 'paused' };
  }

  async resume(id: string) {
    const existing = await this.prisma.download.findUnique({ where: { id } });
    if (!existing) return null;
    const payload = (existing.payload as any) || {};
    const hash = payload.hash as string | undefined;
    if (hash) {
      try {
        const client = await this.getClient();
        await client.resumeTorrent(hash);
      } catch {
        // ignore errors from download client
      }
    }
    await this.prisma.download.update({ where: { id }, data: { state: 'queued' } });
    return { status: 'resumed' };
  }

  async remove(id: string) {
    const existing = await this.prisma.download.findUnique({ where: { id } });
    if (!existing) return null;
    const payload = (existing.payload as any) || {};
    const hash = payload.hash as string | undefined;
    if (hash) {
      try {
        const client = await this.getClient();
        await client.removeTorrent(hash);
      } catch {
        // ignore errors from download client
      }
    }
    await this.prisma.download.delete({ where: { id } });
    return { status: 'removed' };
  }

  async test(opts?: {
    baseUrl?: string;
    username?: string;
    password?: string;
    category?: string;
  }) {
    try {
      let client: QbitClient;
      if (opts?.baseUrl && opts?.username && opts?.password) {
        client = new QbitClient({
          baseURL: opts.baseUrl,
          username: opts.username,
          password: opts.password,
          category: opts.category,
        });
      } else {
        client = await this.getClient();
      }
      await client.listTorrents();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }
}
