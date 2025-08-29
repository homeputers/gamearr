import { Controller, Get, Query, Inject } from '@nestjs/common';
import { GameService } from './game.service.js';

@Controller('games')
export class GameController {
  constructor(@Inject(GameService) private readonly service: GameService) {}

  @Get()
  findAll(
    @Query('platform') platform?: string,
    @Query('regions') regions?: string,
    @Query('yearStart') yearStart?: string,
    @Query('yearEnd') yearEnd?: string,
    @Query('q') q?: string,
  ) {
    const platforms = platform ? platform.split(',').filter(Boolean) : undefined;
    const regionList = regions ? regions.split(',').filter(Boolean) : undefined;
    return this.service.findAll({
      platforms,
      regions: regionList,
      yearStart: yearStart ? parseInt(yearStart, 10) : undefined,
      yearEnd: yearEnd ? parseInt(yearEnd, 10) : undefined,
      q,
    });
  }
}

