import { Body, Controller, Post, Get, Param, Delete, Inject } from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { z } from 'zod';
import { DownloadsService } from './downloads.service.js';
import { ZodValidationPipe } from '../zod-validation.pipe.js';

const magnetSchema = z.object({
  magnet: z.string(),
  category: z.string().optional(),
});

@ApiTags('downloads')
@Controller('downloads')
export class DownloadsController {
  constructor(
    @Inject(DownloadsService) private readonly service: DownloadsService,
  ) {}

  @Post('magnet')
  @ApiBody({ schema: { properties: { magnet: { type: 'string' }, category: { type: 'string', nullable: true } } } })
  addMagnet(
    @Body(new ZodValidationPipe(magnetSchema))
    body: { magnet: string; category?: string },
  ) {
    return this.service.addMagnet(body.magnet, body.category);
  }

  @Get()
  list() {
    return this.service.list();
  }

  @Get('test')
  test() {
    return this.service.test();
  }

  @Post(':id/pause')
  pause(@Param('id') id: string) {
    return this.service.pause(id);
  }

  @Post(':id/resume')
  resume(@Param('id') id: string) {
    return this.service.resume(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
