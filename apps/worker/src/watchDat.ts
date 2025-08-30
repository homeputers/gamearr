import { Queue } from 'bullmq';
import { prisma } from '@gamearr/storage/src/client';
import { config, logger } from '@gamearr/shared';

async function waitForPrismaPlatform(timeoutMs = 30000, intervalMs = 500) {
  const start = Date.now();
  try {
    // Ensure client tries to connect early when available
    if (typeof (prisma as any)?.$connect === 'function') {
      await (prisma as any).$connect();
    }
  } catch (e) {
    logger.warn({ err: e }, 'prisma $connect failed on first attempt, will keep retrying');
  }

  // Poll until prisma.platform delegate is present (generated client ready)
  // Note: This should not be necessary if the Prisma client is generated correctly, but
  // provides a defensive guard to avoid immediate crashes on startup.
  // We also verify that findMany exists to ensure delegate is usable.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const hasPlatform = (prisma as any)?.platform && typeof (prisma as any).platform.findMany === 'function';
    if (hasPlatform) return true;
    if (Date.now() - start > timeoutMs) {
      logger.error('Prisma client is missing the Platform delegate after waiting. Check that @prisma/client is generated for the storage schema.');
      return false;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

export function startDatRefresh(queue: Queue, interval = 24 * 60 * 60 * 1000) {
  const enqueueAll = async () => {
    const platforms = await prisma.platform.findMany({
      where: { nointroDatUrl: { not: null } },
      select: { id: true, nointroDatUrl: true },
    });

    if (platforms.length === 0) {
      logger.warn('no platforms with No-Intro DAT URLs configured');
      return;
    }

    for (const platform of platforms) {
      try {
        await queue.add('refresh', {
          url: platform.nointroDatUrl!,
          platformId: platform.id,
          source: 'nointro',
        });
      } catch (err) {
        logger.error({ err, platformId: platform.id }, 'failed to enqueue dat refresh');
      }
    }
  };

  // Wait for Prisma readiness before first run to avoid crashing on startup
  waitForPrismaPlatform().then((ready) => {
    if (!ready) {
      logger.warn('Skipping initial DAT refresh due to Prisma client not ready. Will try again on next interval.');
      return;
    }
    enqueueAll();
  });
  setInterval(enqueueAll, interval);
}

export function startDatPrune(queue: Queue, interval = 24 * 60 * 60 * 1000) {
  const enqueue = async () => {
    try {
      await queue.add('prune', { keep: config.datPruneKeep });
    } catch (err) {
      logger.error({ err }, 'failed to enqueue dat prune');
    }
  };

  enqueue();
  setInterval(enqueue, interval);
}
