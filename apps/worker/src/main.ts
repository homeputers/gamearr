import { Queue, Worker } from 'bullmq';
import { mkdirSync } from 'node:fs';
import { config, logger, withCorrelationId } from '@gamearr/shared';
import { scanProcessor } from './processors/scan';
import { hashProcessor } from './processors/hash';
import { importProcessor } from './processors/import';
import { datImportProcessor } from './processors/datImport';
import { startWatchCompleted } from './watchCompleted.js';
import { startWatchQbittorrent } from './watchQbittorrent.js';

if (!config.redisUrl) {
  logger.warn('REDIS_URL is not set, worker disabled');
  process.exit(0);
}

mkdirSync(config.paths.datRoot, { recursive: true });
logger.info({ datRoot: config.paths.datRoot }, 'using dat root');

const connection = { connection: { url: config.redisUrl } };

export const scanQueue = new Queue('scan', connection);
export const hashQueue = new Queue('hash', connection);
export const importQueue = new Queue('import', connection);
export const datQueue = new Queue('dat', connection);

new Worker(
  scanQueue.name,
  (job: any) => withCorrelationId(() => scanProcessor(job), job.id),
  connection,
);
new Worker(
  hashQueue.name,
  (job: any) => withCorrelationId(() => hashProcessor(job), job.id),
  connection,
);
new Worker(
  importQueue.name,
  (job: any) => withCorrelationId(() => importProcessor(job), job.id),
  connection,
);
new Worker(
  datQueue.name,
  (job: any) => withCorrelationId(() => datImportProcessor(job), job.id),
  connection,
);

logger.info({ queues: [scanQueue.name, hashQueue.name, importQueue.name, datQueue.name] }, 'worker started');
startWatchCompleted();
startWatchQbittorrent();
