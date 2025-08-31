import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Queue } from 'bullmq';
import { QbitClient } from '@gamearr/adapters';
import { config, logger, readSettings } from '@gamearr/shared';
import prisma from '@gamearr/storage/src/client';
import { walk } from '@gamearr/domain';

export function startWatchQbittorrent(importQueue: Queue, interval = 10000) {
  const root = config.paths.downloadsRoot;
  if (!root) {
    logger.warn('DOWNLOADS_ROOT is not set');
    return;
  }
  const ingestRoot = path.join(root, 'completed', '_ingest');
  fs.mkdir(ingestRoot, { recursive: true });

  (async () => {
    try {
      const settings = await readSettings();
      const qb = settings.downloads.qbittorrent;
      if (!qb.baseUrl || !qb.username || !qb.password) {
        logger.warn('qbittorrent not configured');
        return;
      }
      const client = new QbitClient({
        baseURL: qb.baseUrl,
        username: qb.username,
        password: qb.password,
        category: qb.category,
      });

      setInterval(async () => {
        try {
          const torrents = await client.listTorrents({ category: 'gamearr' });
          for (const t of torrents) {
            if (
              ['stalledUP', 'uploading', 'pausedUP', 'completed'].includes(t.state) &&
              t.progress >= 1
            ) {
              const download = await prisma.download.findFirst({
                where: { payload: { path: ['hash'], equals: t.hash } },
              });
              if (download && !(download as any).doneAt) {
                await prisma.download.update({
                  where: { id: download.id },
                  data: { state: 'completed', doneAt: new Date() },
                });
              }

              const src =
                t.content_path || (t.save_path ? path.join(t.save_path, t.name) : undefined);
              if (!src) continue;
              const dest = path.join(ingestRoot, t.name);
              let finalPath = dest;
              try {
                await fs.mkdir(path.dirname(dest), { recursive: true });
                if (path.resolve(src) !== path.resolve(dest)) {
                  try {
                    await fs.rename(src, dest);
                  } catch (err) {
                    await fs.cp(src, dest, { recursive: true });
                  }
                }
              } catch (err) {
                logger.error({ err, src, dest }, 'failed to move completed torrent');
                finalPath = src;
              }

              const files: string[] = [];
              try {
                const stat = await fs.stat(finalPath);
                if (stat.isDirectory()) {
                  for await (const file of walk(finalPath)) files.push(file);
                } else {
                  files.push(finalPath);
                }
              } catch (err) {
                logger.error({ err, path: finalPath }, 'failed to list files');
                continue;
              }

              for (const file of files) {
                try {
                  await importQueue.add('import', { path: file });
                } catch (err) {
                  logger.error({ err, file }, 'failed to enqueue import job');
                }
              }
            }
          }
        } catch (err) {
          logger.error({ err }, 'qbittorrent poll failed');
        }
      }, interval);
    } catch (err) {
      logger.error({ err }, 'qbittorrent watcher init failed');
    }
  })();
}
