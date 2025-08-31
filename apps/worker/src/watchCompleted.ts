import { promises as fs } from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { config, logger, addActivity } from '@gamearr/shared';
import { hashFile } from '@gamearr/domain';

const execAsync = promisify(exec);

async function processFile(fullPath: string, completedDir: string, stagingDir: string) {
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
  const destRoot = config.paths.libRoot || path.join(config.paths.downloadsRoot || '.', 'library');
  await fs.mkdir(destRoot, { recursive: true });
  const dest = path.join(destRoot, path.basename(working));
  await fs.rename(working, dest);

  await addActivity({
    id: randomUUID(),
    type: 'import',
    timestamp: new Date().toISOString(),
    message: `Imported ${name}`,
    details: { file: name, hash: sha1, target: dest },
  });

  if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
  await fs.rm(fullPath, { force: true });
}

export function startWatchCompleted(interval = 5000) {
  const root = config.paths.downloadsRoot;
  if (!root) {
    logger.warn('DOWNLOADS_ROOT is not set');
    return;
  }
  const completedDir = path.join(root, 'completed');
  const stagingDir = path.join(root, 'staging');
  fs.mkdir(completedDir, { recursive: true });
  fs.mkdir(stagingDir, { recursive: true });

  setInterval(async () => {
    try {
      const entries = await fs.readdir(completedDir);
      for (const entry of entries) {
        const full = path.join(completedDir, entry);
        let stat;
        try {
          stat = await fs.stat(full);
        } catch {
          continue;
        }
        if (!stat.isFile()) continue;
        try {
          await processFile(full, completedDir, stagingDir);
        } catch (err: any) {
          const id = randomUUID();
          await addActivity({
            id,
            type: 'error',
            timestamp: new Date().toISOString(),
            message: err.message,
            details: { file: entry },
            retry: { path: `/imports/activity/${id}/retry`, method: 'POST' },
          });
          logger.error({ err, file: entry }, 'failed to import');
        }
      }
    } catch (err) {
      logger.error({ err }, 'watchCompleted failed');
    }
  }, interval);
}
