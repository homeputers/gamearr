import { Controller, Post } from '@nestjs/common';
import { ExportsService } from './exports.service';

@Controller('exports')
export class ExportsController {
  constructor(private readonly service: ExportsService) {}

  @Post('emulationstation')
  emulationstation() {
    return this.service.emulationstation();
  }
}
