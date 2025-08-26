import { Queue, Worker } from 'bullmq';
import { config, logger } from '@gamearr/shared';
import { scanProcessor } from './processors/scan';
import { hashProcessor } from './processors/hash';
import { importProcessor } from './processors/import';

const connection = { connection: { url: config.redisUrl } };

export const scanQueue = new Queue('scan', connection);
export const hashQueue = new Queue('hash', connection);
export const importQueue = new Queue('import', connection);

new Worker(scanQueue.name, scanProcessor, connection);
new Worker(hashQueue.name, hashProcessor, connection);
new Worker(importQueue.name, importProcessor, connection);

logger.info('worker started');
