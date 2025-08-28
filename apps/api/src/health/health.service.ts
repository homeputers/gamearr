import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { logger } from '@gamearr/shared';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      logger.error(err, 'db check failed');
    }
    // TODO: add real redis check
    return { status: 'ok' };
  }
}
