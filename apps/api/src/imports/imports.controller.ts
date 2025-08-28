import { Body, Controller, Post, Get, Inject } from '@nestjs/common';
import { ImportsService } from './imports.service.js';

@Controller('imports')
export class ImportsController {
  constructor(@Inject(ImportsService) private readonly service: ImportsService) {}

  @Post('organize')
  organize(@Body() body: { artifactId: string; template: string; romsRoot?: string }) {
    return this.service.organize(body.artifactId, body.template, body.romsRoot);
  }

  @Get('activity')
  activity() {
    return this.service.activity();
  }
}
