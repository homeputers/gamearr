import { Controller, Get, Inject } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Get('health')
  check() {
    return this.healthService.check();
  }

  @Get('ready')
  ready() {
    return this.healthService.readiness();
  }

  @Get('live')
  live() {
    return this.healthService.liveness();
  }
}
