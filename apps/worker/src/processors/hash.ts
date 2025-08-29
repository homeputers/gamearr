import type { Job } from 'bullmq';
import { logger } from '@gamearr/shared';
import prisma from '@gamearr/storage/src/client';
import { hashFile, parseCue, parseGdi } from '@gamearr/domain';
import { promises as fs } from 'node:fs';
import path from 'node:path';

interface HashJob {
  artifactId: string;
}

export async function hashProcessor(job: Job<HashJob>) {
  logger.info({ payload: job.data }, 'hash job');
  const { artifactId } = job.data;
  const artifact = await prisma.artifact.findUnique({
    where: { id: artifactId },
    include: { library: true },
  });
  if (!artifact) {
    logger.warn({ artifactId }, 'artifact not found');
    return;
  }

  const fullPath = path.join(artifact.library.path, artifact.path);
  const ext = path.extname(artifact.path).toLowerCase();
  const format = ext ? ext.slice(1) : null;

  const { crc32, sha1 } = await hashFile(fullPath);

  let multiPartGroup: string | undefined;

  if (ext === '.cue') {
    multiPartGroup = artifact.path.replace(/\.[^/.]+$/, '');
    const content = await fs.readFile(fullPath, 'utf8');
    const cue = parseCue(content);
    for (const file of cue.files) {
      const rel = path.join(path.dirname(artifact.path), file.filename);
      await prisma.artifact.updateMany({
        where: { libraryId: artifact.libraryId, path: rel },
        data: { multiPartGroup },
      });
    }
  } else if (ext === '.gdi') {
    multiPartGroup = artifact.path.replace(/\.[^/.]+$/, '');
    const content = await fs.readFile(fullPath, 'utf8');
    const gdi = parseGdi(content);
    for (const track of gdi.tracks) {
      const rel = path.join(path.dirname(artifact.path), track.filename);
      await prisma.artifact.updateMany({
        where: { libraryId: artifact.libraryId, path: rel },
        data: { multiPartGroup },
      });
    }
  }

  const data: Record<string, unknown> = { crc32, sha1, format };
  if (typeof multiPartGroup !== 'undefined') {
    data.multiPartGroup = multiPartGroup;
  }

  await prisma.artifact.update({
    where: { id: artifactId },
    data,
  });

  const datEntry = await prisma.datEntry.findFirst({
    where: {
      platformId: artifact.library.platformId,
      OR: [{ hashCrc: crc32 }, { hashSha1: sha1 }],
    },
  });
  if (datEntry) {
    let game = await prisma.game.findFirst({
      where: { provider: datEntry.source, providerId: datEntry.canonicalName },
    });
    if (!game) {
      game = await prisma.game.create({
        data: {
          title: datEntry.canonicalName,
          provider: datEntry.source,
          providerId: datEntry.canonicalName,
        },
      });
    }
    let release = await prisma.release.findFirst({
      where: {
        gameId: game.id,
        region: datEntry.region ?? undefined,
        language: datEntry.languages ?? undefined,
      },
    });
    if (!release) {
      release = await prisma.release.create({
        data: { gameId: game.id, region: datEntry.region, language: datEntry.languages },
      });
    }
    await prisma.artifact.update({
      where: { id: artifactId },
      data: { releaseId: release.id },
    });
  } else {
    // Fallback: create a game entry using the file name when no DAT match is found
    const title = path.basename(artifact.path, path.extname(artifact.path));
    let game = await prisma.game.findFirst({
      where: { provider: 'file', providerId: sha1 },
    });
    if (!game) {
      game = await prisma.game.create({
        data: { title, provider: 'file', providerId: sha1 },
      });
    }
    let release = await prisma.release.findFirst({ where: { gameId: game.id } });
    if (!release) {
      release = await prisma.release.create({ data: { gameId: game.id } });
    }
    await prisma.artifact.update({
      where: { id: artifactId },
      data: { releaseId: release.id },
    });
  }
}

export default hashProcessor;
