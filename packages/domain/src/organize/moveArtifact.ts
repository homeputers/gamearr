import fs from 'node:fs/promises';
import path from 'node:path';
import { renderTemplate } from './renderTemplate.js';

export interface ArtifactInfo {
  path: string;
  multiPartGroup?: string | null;
  library: { path: string; platform: { name: string } };
  release?: { game: { title: string } };
}

export async function moveArtifact(
  artifact: ArtifactInfo,
  template: string,
  romsRoot = '/roms',
): Promise<string> {
  const src = path.join(artifact.library.path, artifact.path);
  const ext = path.extname(artifact.path);
  const ctx = {
    platform: artifact.library.platform.name,
    game: artifact.release?.game.title ?? path.parse(artifact.path).name,
    disc: artifact.multiPartGroup ?? '',
    ext,
  } as Record<string, unknown>;
  const name = renderTemplate(ctx, template) + ext;
  const dest = path.join(romsRoot, artifact.library.platform.name, name);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.rename(src, dest);
  return dest;
}
