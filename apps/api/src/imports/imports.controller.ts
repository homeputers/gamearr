import { Body, Controller, Post } from '@nestjs/common';
import { ImportsService } from './imports.service.js';

@Controller('imports')
export class ImportsController {
  constructor(private readonly service: ImportsService) {}

  @Post('organize')
  organize(@Body() body: { artifactId: string; template: string }) {
    return this.service.organize(body.artifactId, body.template);
  }
}
