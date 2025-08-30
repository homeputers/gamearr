import type { Job } from 'bullmq';
import { datImportProcessor } from './datImport.js';
import { datRecheckProcessor } from './datRecheck.js';
import { datPruneProcessor } from './datPrune.js';

export async function datProcessor(job: Job) {
  const { name } = job as any;

  switch (name) {
    case 'import':
      return datImportProcessor(job as any);
    case 'recheck-platform':
      return datRecheckProcessor(job as any);
    case 'prune':
      return datPruneProcessor(job as any);
    default:
      throw new Error(`Unknown job name ${name}`);
  }
}

export default datProcessor;
