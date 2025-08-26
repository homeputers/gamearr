import type { Job } from 'bullmq';
import { logger } from '@gamearr/shared';

export async function scanProcessor(job: Job) {
  logger.info({ payload: job.data }, 'scan job');
}

export default scanProcessor;
