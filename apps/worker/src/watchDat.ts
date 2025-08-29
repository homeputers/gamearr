import { Queue } from 'bullmq';
import prisma from '@gamearr/storage/src/client';
import { logger } from '@gamearr/shared';

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

  enqueueAll();
  setInterval(enqueueAll, interval);
}
