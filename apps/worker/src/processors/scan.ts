import type { Job } from 'bullmq';
import { Queue } from 'bullmq';
import { logger, config, addActivity } from '@gamearr/shared';
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

  try {
    const library = await prisma.library.findUnique({
      where: { id: libraryId },
      include: { platform: true },
    });
    if (!library) {
      logger.warn({ libraryId }, 'library not found');
      return;
    }

    try {
      await fs.access(library.path);
    } catch {
      logger.warn({ path: library.path }, 'library path missing');
      return;
    }

    const allowed = (library.platform.extensions || []).map((e: string) =>
      e.toLowerCase(),
    );
    logger.info(
      { path: library.path, extensions: allowed },
      'starting library scan',
    );

    let processed = 0;
    try {
      for await (const full of walk(library.path)) {
        logger.debug({ file: full }, 'processing file');
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
          logger.debug({ artifactId: artifact.id, rel }, 'artifact created');
          if (hashQueue) {
            await hashQueue.add('hash', { artifactId: artifact.id });
          }
          await addActivity({
            type: 'scan',
            timestamp: new Date().toISOString(),
            message: `Scanned ${rel}`,
            details: { file: full },
          });
        } else if (existing.size !== stat.size) {
          await prisma.artifact.update({
            where: { id: existing.id },
            data: { size: stat.size },
          });
        }
        processed += 1;
      }
    } catch (err) {
      logger.error({ err, path: library.path }, 'scan failed');
      throw err;
    }

    await prisma.library.update({
      where: { id: libraryId },
      data: { lastScannedAt: new Date() },
    });
    logger.info({ libraryId, processed }, 'scan complete');
  } catch (err) {
    logger.error({ err, libraryId }, 'scan processor failed');
    throw err;
  }
}

export default scanProcessor;
