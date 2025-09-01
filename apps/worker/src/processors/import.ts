import type { Job } from 'bullmq';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { logger, config, addActivity } from '@gamearr/shared';
import { hashFile } from '@gamearr/domain';

interface ImportJob {
  path: string;
}

const execAsync = promisify(exec);

async function processFile(fullPath: string, stagingDir: string, destRoot: string) {
  const name = path.basename(fullPath);
  let working = fullPath;
  let tempDir: string | undefined;
  const ext = path.extname(name).toLowerCase();

  if (ext === '.zip') {
    tempDir = path.join(stagingDir, path.parse(name).name);
    await fs.mkdir(tempDir, { recursive: true });
    await execAsync(`unzip -o ${JSON.stringify(fullPath)} -d ${JSON.stringify(tempDir)}`);
    const items = await fs.readdir(tempDir);
    if (items.length === 0) throw new Error('archive empty');
    working = path.join(tempDir, items[0]);
  } else if (ext === '.7z') {
    throw new Error('7z archives not supported');
  }

  const { sha1 } = await hashFile(working);
  await fs.mkdir(destRoot, { recursive: true });
  const dest = path.join(destRoot, path.basename(working));
  await fs.rename(working, dest);

  await addActivity({
    id: randomUUID(),
    type: 'import',
    timestamp: new Date().toISOString(),
    message: `Imported ${name}`,
    details: { file: dest, source: fullPath, hashes: { sha1 }, target: dest },
  });

  if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
  await fs.rm(fullPath, { force: true });
}

export async function importProcessor(job: Job<ImportJob>) {
  logger.info({ payload: job.data }, 'import job');
  const root = config.paths.downloadsRoot;
  if (!root) {
    logger.warn('DOWNLOADS_ROOT is not set');
    return;
  }
  const stagingDir = path.join(root, 'staging');
  const destRoot = config.paths.libRoot || path.join(root, 'library');
  await fs.mkdir(stagingDir, { recursive: true });
  await fs.mkdir(destRoot, { recursive: true });

  try {
    await processFile(job.data.path, stagingDir, destRoot);
  } catch (err: any) {
    const id = randomUUID();
    await addActivity({
      id,
      type: 'error',
      timestamp: new Date().toISOString(),
      message: err.message,
      details: { file: job.data.path },
      retry: { path: `/imports/activity/${id}/retry`, method: 'POST' },
    });
    logger.error({ err, file: job.data.path }, 'failed to import');
  }
}

export default importProcessor;
