import { Controller, Get, Inject } from '@nestjs/common';
import { PlatformService } from './platform.service';

@Controller('platforms')
export class PlatformController {
  constructor(@Inject(PlatformService) private readonly service: PlatformService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
