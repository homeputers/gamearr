import type { Job } from 'bullmq';
import prisma from '@gamearr/storage/src/client';
import { logger, addActivity } from '@gamearr/shared';

interface RecheckJob {
  platformId: string;
}

export async function datRecheckProcessor(job: Job<RecheckJob>) {
  logger.info({ payload: job.data }, 'dat recheck job');
  const { platformId } = job.data;
  const platform = await prisma.platform.findUnique({
    where: { id: platformId },
    select: { id: true, name: true, activeDatFileId: true },
  });
  if (!platform) {
    logger.warn({ platformId }, 'platform not found');
    return;
  }
  if (!platform.activeDatFileId) {
    logger.warn({ platformId }, 'platform has no active DAT');
    return;
  }
  const artifacts = await prisma.artifact.findMany({
    where: {
      releaseId: null,
      library: { platformId },
      OR: [{ crc32: { not: null } }, { sha1: { not: null } }],
    },
    select: { id: true, crc32: true, sha1: true },
  });
  let matched = 0;
  for (const artifact of artifacts) {
    const datEntry = await prisma.datEntry.findFirst({
      where: {
        platformId,
        datFileId: platform.activeDatFileId,
        OR: [{ hashCrc: artifact.crc32 }, { hashSha1: artifact.sha1 }],
      },
    });
    if (!datEntry) continue;
    let game = await prisma.game.findFirst({
      where: { provider: datEntry.source, providerId: datEntry.canonicalName },
    });
    if (!game) {
      game = await prisma.game.create({
        data: {
          title: datEntry.canonicalName,
          provider: datEntry.source,
          providerId: datEntry.canonicalName,
        },
      });
    }
    let release = await prisma.release.findFirst({
      where: {
        gameId: game.id,
        region: datEntry.region ?? undefined,
        language: datEntry.languages ? datEntry.languages[0] : undefined,
      },
    });
    if (!release) {
      release = await prisma.release.create({
        data: {
          gameId: game.id,
          region: datEntry.region,
          language: datEntry.languages ? datEntry.languages[0] : undefined,
        },
      });
    }
    await prisma.artifact.update({
      where: { id: artifact.id },
      data: { releaseId: release.id },
    });
    matched++;
  }
  await addActivity({
    type: 'match',
    timestamp: new Date().toISOString(),
    message: `DAT recheck matched ${matched} of ${artifacts.length} artifacts on ${platform.name}`,
    details: { platformId, matched, total: artifacts.length },
  });
}

export default datRecheckProcessor;
