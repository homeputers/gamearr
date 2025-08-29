import { Controller, Post, Get } from '@nestjs/common';
import { ExportsService } from './exports.service';

@Controller('exports')
export class ExportsController {
  constructor(private readonly service: ExportsService) {}

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
