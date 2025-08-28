import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { logger, config } from '@gamearr/shared';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async checkDb() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (err) {
      logger.error(err, 'db check failed');
      return { status: 'error' };
    }
  }

  private async checkRedis() {
    if (!config.redisUrl) {
      return { status: 'skipped' };
    }
    const queue = new Queue('health', { connection: { url: config.redisUrl } });
    try {
      const client = await queue.client;
      await client.ping();
      await queue.disconnect();
      return { status: 'ok' };
    } catch (err) {
      logger.error(err, 'redis check failed');
      return { status: 'error' };
    }
  }

  async readiness() {
    const [db, redis] = await Promise.all([this.checkDb(), this.checkRedis()]);
    return { db, redis };
  }

  async liveness() {
    return { status: 'ok' };
  }

  async check() {
    return this.readiness();
  }
}
