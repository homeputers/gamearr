import { Controller, Get, Post, Query, Res, Sse, MessageEvent } from '@nestjs/common';
import { SupportService } from './support.service.js';
import { Response } from 'express';
import { Observable } from 'rxjs';

@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get('logs')
  getLogs(
    @Query('level') level?: string,
    @Query('module') module?: string,
    @Query('offset') offset = '0',
    @Query('limit') limit = '100',
  ) {
    return this.support.getLogs({
      level,
      module,
      offset: Number(offset),
      limit: Number(limit),
    });
  }

  @Sse('logs/stream')
  streamLogs(
    @Query('level') level?: string,
    @Query('module') module?: string,
  ): Observable<MessageEvent> {
    return this.support.streamLogs({ level, module });
  }

  @Post('bundle')
  async bundle(@Res() res: Response) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="support-bundle.zip"',
    );
    await this.support.generateBundle(res);
  }
}

