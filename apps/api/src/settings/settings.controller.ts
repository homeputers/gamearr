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

  @Get('providers')
  getProviders() {
    return this.service.getProviders();
  }

  @Put('providers')
  setProviders(
    @Body()
    body: { providers: any; downloads?: any; features: Record<string, boolean> },
  ) {
    return this.service.setProviders(body);
  }

  @Get('downloads/qbit')
  getQbit() {
    return this.service.getQbit();
  }

  @Put('downloads/qbit')
  setQbit(@Body() body: any) {
    return this.service.setQbit(body);
  }
}

