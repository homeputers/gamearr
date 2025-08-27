import { Injectable } from '@nestjs/common';
import { qbittorrent } from '@gamearr/adapters';

@Injectable()
export class DownloadsService {
  addMagnet(magnet: string) {
    return qbittorrent.addMagnet(magnet);
  }
}
