import type { Job } from 'bullmq';
import { promises as fs } from 'node:fs';
import prisma from '@gamearr/storage/src/client';
import { config, logger } from '@gamearr/shared';

interface DatPruneJob {
  keep?: number;
}

export async function datPruneProcessor(job: Job<DatPruneJob>) {
  const keep = job.data?.keep ?? config.datPruneKeep;
  logger.info({ keep }, 'dat prune job');

  const platforms = await prisma.platform.findMany({
    select: { id: true, activeDatFileId: true },
  });

  for (const platform of platforms) {
    const datFiles: { id: string; path: string }[] = await prisma.datFile.findMany({
      where: { platformId: platform.id },
      orderBy: { uploadedAt: 'desc' },
      select: { id: true, path: true },
    });

    const inactive = datFiles.filter((df) => df.id !== platform.activeDatFileId);
    const toPrune = inactive.slice(keep);

    for (const file of toPrune) {
      try {
        await prisma.datEntry.deleteMany({ where: { datFileId: file.id } });
        await fs.rm(file.path, { force: true });
        await prisma.datFile.delete({ where: { id: file.id } });
        logger.info({ datFileId: file.id, platformId: platform.id }, 'pruned dat file');
      } catch (err) {
        logger.error({ err, datFileId: file.id, platformId: platform.id }, 'failed to prune dat file');
      }
    }
  }
}

export default datPruneProcessor;
