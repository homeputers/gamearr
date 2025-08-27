import { Queue, Worker } from 'bullmq';
import { config, logger } from '@gamearr/shared';
import { scanProcessor } from './processors/scan';
import { hashProcessor } from './processors/hash';
import { importProcessor } from './processors/import';
import { datProcessor } from './processors/dat';
import { startWatchCompleted } from './watchCompleted.js';
import { startWatchQbittorrent } from './watchQbittorrent.js';
import { startDatRefresh } from './watchDat.js';

if (!config.redisUrl) {
  logger.warn('REDIS_URL is not set, worker disabled');
  process.exit(0);
}

const connection = { connection: { url: config.redisUrl } };

export const scanQueue = new Queue('scan', connection);
export const hashQueue = new Queue('hash', connection);
export const importQueue = new Queue('import', connection);
export const datQueue = new Queue('dat', connection);

new Worker(scanQueue.name, scanProcessor, connection);
new Worker(hashQueue.name, hashProcessor, connection);
new Worker(importQueue.name, importProcessor, connection);
new Worker(datQueue.name, datProcessor, connection);

logger.info({ queues: [scanQueue.name, hashQueue.name, importQueue.name, datQueue.name] }, 'worker started');
startWatchCompleted();
startWatchQbittorrent();
startDatRefresh(datQueue);
