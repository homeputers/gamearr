import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Inject,
} from '@nestjs/common';
import { DownloadsService } from './downloads.service.js';

@Controller('downloads')
export class DownloadsController {
  constructor(
    @Inject(DownloadsService) private readonly service: DownloadsService,
  ) {}

  @Post('magnet')
  addMagnet(@Body() body: { magnet: string }) {
    return this.service.addMagnet(body.magnet);
  }

  @Get()
  list() {
    return this.service.list();
  }

  @Post(':hash/pause')
  pause(@Param('hash') hash: string) {
    return this.service.pause(hash);
  }

  @Post(':hash/resume')
  resume(@Param('hash') hash: string) {
    return this.service.resume(hash);
  }

  @Delete(':hash')
  remove(@Param('hash') hash: string) {
    return this.service.remove(hash);
  }
}
