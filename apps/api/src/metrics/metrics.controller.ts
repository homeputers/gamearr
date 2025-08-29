import { Controller, Get, Inject } from '@nestjs/common';
import { MetricsService } from './metrics.service.js';

@Controller('metrics')
export class MetricsController {
  constructor(
    @Inject(MetricsService) private readonly service: MetricsService,
  ) {}

  @Get('summary')
  summary() {
    return this.service.summary();
  }

  @Get('timeseries')
  timeseries() {
    return this.service.timeseries();
  }
}

