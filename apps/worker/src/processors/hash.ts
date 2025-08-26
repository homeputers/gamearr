import type { Job } from 'bullmq';
import { logger } from '@gamearr/shared';

export async function hashProcessor(job: Job) {
  logger.info({ payload: job.data }, 'hash job');
}

export default hashProcessor;
