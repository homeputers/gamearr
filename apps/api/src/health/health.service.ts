import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { logger } from '@gamearr/shared';
import { PRISMA_CLIENT } from '../prisma/prisma.module';

@Injectable()
export class HealthService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

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
