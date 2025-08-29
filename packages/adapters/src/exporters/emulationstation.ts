import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { getGame as rawgGetGame } from '../providers/rawg';

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const providerGetters: Record<string, (id: string) => Promise<any>> = {
  rawg: rawgGetGame,
};

export async function exportEmulationStation({
  prisma,
  outDir,
}: {
  prisma: any;
  outDir: string;
}) {
  const platforms = await prisma.platform.findMany({
    include: {
      libraries: {
        include: {
          artifacts: {
            where: { releaseId: { not: null }, preferred: true },
            include: { release: { include: { game: true } } },
          } as any,
        },
      },
    },
  } as any);

  const assetsRoot = path.join(outDir, 'assets');
  await fs.mkdir(assetsRoot, { recursive: true });

  const gameCache = new Map<string, any>();

  for (const platform of platforms) {
    const platformDir = path.join(outDir, platform.name);
    await fs.mkdir(platformDir, { recursive: true });
    const entries: string[] = [];

    for (const library of platform.libraries) {
      for (const artifact of library.artifacts) {
        if (!artifact.release) continue;
        const game = artifact.release.game;
        const key = `${game.provider}:${game.providerId}`;
        if (!gameCache.has(key)) {
          const getter = providerGetters[game.provider];
          if (getter) {
            try {
              const data = await getter(game.providerId);
              gameCache.set(key, data);
            } catch {
              gameCache.set(key, {});
            }
          } else {
            gameCache.set(key, {});
          }
        }
        const details = gameCache.get(key) || {};
        const slug = slugify(game.title);
        const assetDir = path.join(assetsRoot, platform.name, slug);
        await fs.mkdir(assetDir, { recursive: true });

        let imageRel: string | undefined;
        if (details.coverUrl) {
          try {
            const res = await fetch(details.coverUrl);
            if (res.ok && res.body) {
              const ext = path.extname(new URL(details.coverUrl).pathname) || '.jpg';
              const imgPath = path.join(assetDir, 'image' + ext);
              await pipeline(res.body, createWriteStream(imgPath));
              imageRel = path.relative(platformDir, imgPath);
            }
          } catch {
            // ignore download errors
          }
        }

        let videoRel: string | undefined;
        if (details.videoUrl) {
          try {
            const res = await fetch(details.videoUrl);
            if (res.ok && res.body) {
              const ext = path.extname(new URL(details.videoUrl).pathname) || '.mp4';
              const vidPath = path.join(assetDir, 'video' + ext);
              await pipeline(res.body, createWriteStream(vidPath));
              videoRel = path.relative(platformDir, vidPath);
            }
          } catch {
            // ignore download errors
          }
        }

        const lines: string[] = [];
        lines.push('  <game>');
        lines.push(`    <path>${escapeXml(artifact.path)}</path>`);
        lines.push(`    <name>${escapeXml(game.title)}</name>`);
        lines.push(`    <desc>${escapeXml(details.description || '')}</desc>`);
        if (imageRel) lines.push(`    <image>${escapeXml(imageRel)}</image>`);
        if (videoRel) lines.push(`    <video>${escapeXml(videoRel)}</video>`);
        lines.push('  </game>');
        entries.push(lines.join('\n'));
      }
    }

    const xml = ['<?xml version="1.0"?>', '<gameList>', ...entries, '</gameList>'].join('\n');
    await fs.writeFile(path.join(platformDir, 'gamelist.xml'), xml, 'utf8');
  }
}

export default { exportEmulationStation };
