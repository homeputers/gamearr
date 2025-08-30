import { Injectable } from '@nestjs/common';
import { QbitClient } from '@gamearr/adapters';
import { readSettings } from '@gamearr/shared';

@Injectable()
export class DownloadsService {
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

  async addMagnet(magnet: string) {
    const client = await this.getClient();
    return client.addMagnet(magnet);
  }

  async list() {
    const client = await this.getClient();
    const torrents = await client.listTorrents();
    return torrents.map((t) => ({
      hash: t.hash,
      name: t.name,
      state: t.state,
      progress: t.progress,
      dlspeed: t.dlspeed,
      eta: t.eta,
      client: 'qbittorrent',
    }));
  }

  async pause(hash: string) {
    const client = await this.getClient();
    return client.pauseTorrent(hash);
  }

  async resume(hash: string) {
    const client = await this.getClient();
    return client.resumeTorrent(hash);
  }

  async remove(hash: string) {
    const client = await this.getClient();
    return client.removeTorrent(hash);
  }
}
