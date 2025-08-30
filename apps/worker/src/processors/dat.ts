import type { Job } from 'bullmq';
import { datImportProcessor } from './datImport.js';
import { datRecheckProcessor } from './datRecheck.js';

export async function datProcessor(job: Job) {
  switch (job.name) {
    case 'import':
      return datImportProcessor(job as any);
    case 'recheck-platform':
      return datRecheckProcessor(job as any);
    default:
      throw new Error(`Unknown job name ${job.name}`);
  }
}

export default datProcessor;
