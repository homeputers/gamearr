import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { renderTemplate } from '@gamearr/domain';
import path from 'node:path';
import fs from 'node:fs/promises';

@Injectable()
export class OrganizeService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async preview(artifactId: string, template: string, romsRoot = '/roms') {
    const artifact = await this.prisma.artifact.findUnique({
      where: { id: artifactId },
      include: {
        library: { include: { platform: true } },
        release: { include: { game: true } },
      },
    });
    if (!artifact) {
      throw new NotFoundException('Artifact not found');
    }
    const ext = path.extname(artifact.path);
    const ctx = {
      platform: artifact.library.platform.name,
      game: artifact.release?.game.title ?? path.parse(artifact.path).name,
      disc: artifact.multiPartGroup ?? '',
      ext,
    } as Record<string, unknown>;
    try {
      const name = renderTemplate(ctx, template) + ext;
      const dest = path.join(romsRoot, artifact.library.platform.name, name);
      return { path: dest };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  async organizeLibrary(
    libraryId: string,
    template: string,
    dryRun = false,
    romsRoot = '/roms',
  ) {
    const artifacts = await this.prisma.artifact.findMany({
      where: { libraryId },
      include: {
        library: { include: { platform: true } },
        release: { include: { game: true } },
      },
    });
    if (artifacts.length === 0) {
      throw new NotFoundException('No artifacts found');
    }
    const renames: { from: string; to: string }[] = [];
    for (const artifact of artifacts as any[]) {
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
      renames.push({ from: src, to: dest });
      if (!dryRun) {
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.rename(src, dest);
      }
    }
    return { renames };
  }
}
