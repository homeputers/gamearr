import { Controller, Get, Put, Body, Inject } from '@nestjs/common';
import { SettingsService } from './settings.service.js';

@Controller('settings')
export class SettingsController {
  constructor(@Inject(SettingsService) private readonly service: SettingsService) {}

  @Get('organize')
  getOrganize() {
    return this.service.getOrganize();
  }

  @Put('organize')
  setOrganize(@Body() body: { template: string }) {
    return this.service.setOrganize(body.template);
  }
}

