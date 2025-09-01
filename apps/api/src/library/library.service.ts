import { Injectable, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { config } from '@gamearr/shared';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LibraryService {
  private readonly scanQueue?: Queue;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    if (config.redisUrl) {
      this.scanQueue = new Queue('scan', { connection: { url: config.redisUrl } });
    }
  }

  create(data: { path: string; platformId: string; autoOrganizeOnImport?: boolean }) {
    return this.prisma.library.create({ data });
  }

  async findAll() {
    const libs = await this.prisma.library.findMany({
      include: { _count: { select: { artifacts: true } } },
    });
    return Promise.all(
      libs.map(async (lib: any) => {
        const unmatched = await this.prisma.artifact.count({
          where: { libraryId: lib.id, releaseId: null },
        });
        const { _count, ...rest } = lib as any;
        return {
          ...rest,
          artifactCount: _count.artifacts,
          unmatchedCount: unmatched,
        };
      }),
    );
  }

  update(
    id: string,
    data: { path?: string; platformId?: string; autoOrganizeOnImport?: boolean },
  ) {
    return this.prisma.library.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.library.delete({ where: { id } });
  }

  async scan(id: string) {
    if (this.scanQueue) {
      await this.scanQueue.add('scan', { libraryId: id });
    }
    return { status: 'queued' };
  }
}
