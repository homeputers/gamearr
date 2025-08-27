import type { Job } from 'bullmq';
import prisma from '@gamearr/storage/src/client';
import { logger } from '@gamearr/shared';
import { dat } from '@gamearr/adapters';

interface DatRefreshJob {
  url: string;
  platformId: string;
  source: string;
}

export async function datProcessor(job: Job<DatRefreshJob>) {
  logger.info({ payload: job.data }, 'dat refresh job');
  const { url, platformId, source } = job.data;
  const entries = await dat.nointro.loadDat(url);
  await prisma.datEntry.deleteMany({ where: { platformId, source } });
  if (entries.length === 0) return;
  await prisma.datEntry.createMany({
    data: entries.map((e) => ({
      hashCrc: e.crc,
      hashSha1: e.sha1,
      canonicalName: e.name,
      region: e.region,
      languages: e.languages,
      serial: e.serial,
      source,
      platformId,
    })),
  });
}

export default datProcessor;
