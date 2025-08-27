import { Body, Controller, Post } from '@nestjs/common';
import { DownloadsService } from './downloads.service';

@Controller('downloads')
export class DownloadsController {
  constructor(private readonly service: DownloadsService) {}

  @Post('magnet')
  addMagnet(@Body() body: { magnet: string }) {
    return this.service.addMagnet(body.magnet);
  }
}
