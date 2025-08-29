import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service.js';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly service: MetricsService) {}

  @Get('summary')
  summary() {
    return this.service.summary();
  }

  @Get('timeseries')
  timeseries() {
    return this.service.timeseries();
  }
}

