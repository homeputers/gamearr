import { Queue } from 'bullmq';
import { config, logger } from '@gamearr/shared';

export function startDatRefresh(queue: Queue, interval = 24 * 60 * 60 * 1000) {
  const url = config.dat?.nointroUrl;
  const platformId = config.dat?.nointroPlatformId;
  if (!url || !platformId) {
    logger.warn('NOINTRO_DAT_URL or NOINTRO_PLATFORM_ID is not set');
    return;
  }
  const enqueue = async () => {
    try {
      await queue.add('refresh', { url, platformId, source: 'nointro' });
    } catch (err) {
      logger.error({ err }, 'failed to enqueue dat refresh');
    }
  };
  enqueue();
  setInterval(enqueue, interval);
}
