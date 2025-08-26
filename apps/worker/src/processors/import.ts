import type { Job } from 'bullmq';
import { logger } from '@gamearr/shared';

export async function importProcessor(job: Job) {
  logger.info({ payload: job.data }, 'import job');
}

export default importProcessor;
