import { Controller, Post, Get, Inject } from '@nestjs/common';
import { ExportsService } from './exports.service.js';

@Controller('exports')
export class ExportsController {
  constructor(@Inject(ExportsService) private readonly service: ExportsService) {}

  @Get()
  status() {
    return this.service.getStatus();
  }

  @Post('emulationstation')
  emulationstation() {
    return this.service.emulationstation();
  }

  @Post('playnite')
  playnite() {
    return this.service.playnite();
  }

  @Post('steam')
  steam() {
    return this.service.steam();
  }
}
