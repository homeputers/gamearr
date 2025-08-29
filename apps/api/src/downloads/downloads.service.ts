import { Injectable } from '@nestjs/common';
import { qbittorrent } from '@gamearr/adapters';

@Injectable()
export class DownloadsService {
  addMagnet(magnet: string) {
    return qbittorrent.addMagnet(magnet);
  }

  async list() {
    const torrents = await qbittorrent.getStatus();
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

  pause(hash: string) {
    return qbittorrent.pause(hash);
  }

  resume(hash: string) {
    return qbittorrent.resume(hash);
  }

  remove(hash: string) {
    return qbittorrent.remove(hash);
  }
}
