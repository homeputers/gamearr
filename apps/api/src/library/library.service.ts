import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { config } from '@gamearr/shared';
import { PRISMA_CLIENT } from '../prisma/prisma.module';

@Injectable()
export class LibraryService {
  private readonly scanQueue?: Queue;

  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {
    if (config.redisUrl) {
      this.scanQueue = new Queue('scan', { connection: { url: config.redisUrl } });
    }
  }

  create(data: { path: string; platformId: string }) {
    return this.prisma.library.create({ data });
  }

  findAll() {
    return this.prisma.library.findMany();
  }

  async scan(id: string) {
    if (this.scanQueue) {
      await this.scanQueue.add('scan', { libraryId: id });
    }
    return { status: 'queued' };
  }
}
