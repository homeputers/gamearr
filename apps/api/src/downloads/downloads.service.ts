import { Injectable, Inject } from '@nestjs/common';
import { QbitClient } from '@gamearr/adapters';
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

  async addMagnet(magnet: string, category?: string) {
    const client = await this.getClient();
    await client.addMagnet(magnet, { category });
    const hashMatch = magnet.match(/btih:([^&]+)/i);
    const hash = hashMatch ? hashMatch[1] : undefined;
    return this.prisma.download.create({
      data: {
        state: 'queued',
        client: 'qbit',
        payload: { magnet, hash, category },
      },
    });
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
}
