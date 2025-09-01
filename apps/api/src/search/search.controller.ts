import { Controller, Get, Query, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service.js';

@ApiTags('search')
@Controller()
export class SearchController {
  constructor(@Inject(SearchService) private readonly service: SearchService) {}

  @Get('search')
  search(
    @Query('title') title: string,
    @Query('platform') platform = '',
    @Query('year') year?: string,
    @Query('regionPref') regionPref?: string,
    @Query('limit') limit?: string,
  ) {
    const regions = regionPref
      ? regionPref
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean)
      : undefined;
    return this.service.search({
      title,
      platform,
      year: year ? Number(year) : undefined,
      regionPref: regions,
      limit: limit ? Number(limit) : undefined,
    });
  }

}

