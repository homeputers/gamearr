import { Body, Controller, Get, Param, Post, Query, Inject } from '@nestjs/common';
import { MatchService } from './match.service';

@Controller('artifacts')
export class MatchController {
  constructor(@Inject(MatchService) private readonly service: MatchService) {}

  @Get('unmatched')
  getUnmatched(@Query('page') page = '1', @Query('limit') limit = '50') {
    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;
    return this.service.findUnmatched(skip, take);
    }

  @Post(':id/match')
  match(
    @Param('id') id: string,
    @Body() body: { provider: string; providerId: string },
  ) {
    return this.service.matchArtifact(id, body.provider, body.providerId);
  }
}
