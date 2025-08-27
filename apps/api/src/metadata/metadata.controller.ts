import { Controller, Get, Query } from '@nestjs/common';
import { MetadataService } from './metadata.service';

@Controller('metadata')
export class MetadataController {
  constructor(private readonly service: MetadataService) {}

  @Get('search')
  search(
    @Query('q') q: string,
    @Query('platform') platform: string,
    @Query('year') year?: string,
  ) {
    return this.service.search(q, platform, year ? parseInt(year, 10) : undefined);
  }
}
