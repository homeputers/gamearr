import { promises as fs } from 'node:fs';
import path from 'node:path';
import { qbittorrent } from '@gamearr/adapters';
import { config, logger } from '@gamearr/shared';

export function startWatchQbittorrent(interval = 5000) {
  const root = config.paths.downloadsRoot;
  if (!root) {
    logger.warn('DOWNLOADS_ROOT is not set');
    return;
  }
  const completedDir = path.join(root, 'completed');
  fs.mkdir(completedDir, { recursive: true });

  setInterval(async () => {
    try {
      const torrents = await qbittorrent.getStatus();
      for (const t of torrents) {
        if (t.state === 'completed') {
          const src = t.content_path || (t.save_path ? path.join(t.save_path, t.name) : undefined);
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
}
