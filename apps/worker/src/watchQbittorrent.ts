import { promises as fs } from 'node:fs';
import path from 'node:path';
import { QbitClient } from '@gamearr/adapters';
import { config, logger, readSettings } from '@gamearr/shared';

export function startWatchQbittorrent(interval = 5000) {
  const root = config.paths.downloadsRoot;
  if (!root) {
    logger.warn('DOWNLOADS_ROOT is not set');
    return;
  }
  const completedDir = path.join(root, 'completed');
  fs.mkdir(completedDir, { recursive: true });

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
          const torrents = await client.listTorrents();
          for (const t of torrents) {
            if (t.state === 'completed') {
              const src =
                t.content_path || (t.save_path ? path.join(t.save_path, t.name) : undefined);
              if (!src) continue;
              const dest = path.join(completedDir, path.basename(src));
              try {
                await fs.rename(src, dest);
              } catch (err) {
                logger.error({ err, src, dest }, 'failed to move completed torrent');
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
