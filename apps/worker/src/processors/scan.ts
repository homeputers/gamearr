import type { Job } from 'bullmq';
import { Queue } from 'bullmq';
import { logger, config } from '@gamearr/shared';
import prisma from '@gamearr/storage/src/client';
import { walk } from '@gamearr/domain';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const hashQueue = config.redisUrl
  ? new Queue('hash', { connection: { url: config.redisUrl } })
  : undefined;

export async function scanProcessor(job: Job<{ libraryId: string }>) {
  logger.info({ payload: job.data }, 'scan job');
  const { libraryId } = job.data;
  const library = await prisma.library.findUnique({
    where: { id: libraryId },
    include: { platform: true },
  });
  if (!library) {
    logger.warn({ libraryId }, 'library not found');
    return;
  }
  const allowed = library.platform.extensions || [];
  for await (const full of walk(library.path)) {
    const ext = path.extname(full).toLowerCase();
    if (allowed.length && !allowed.includes(ext)) continue;
    const rel = path.relative(library.path, full);
    const stat = await fs.stat(full);
    const existing = await prisma.artifact.findUnique({
      where: { libraryId_path: { libraryId, path: rel } },
    });
    if (!existing) {
      const artifact = await prisma.artifact.create({
        data: { libraryId, path: rel, size: stat.size },
      });
      if (hashQueue) {
        await hashQueue.add('hash', { artifactId: artifact.id });
      }
    } else if (existing.size !== stat.size) {
      await prisma.artifact.update({
        where: { id: existing.id },
        data: { size: stat.size },
      });
    }
  }
}

export default scanProcessor;
