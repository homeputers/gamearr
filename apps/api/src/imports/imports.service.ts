import { Injectable, NotFoundException } from '@nestjs/common';
import { moveArtifact } from '@gamearr/domain';
import { readActivity, removeActivity } from '@gamearr/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import path from 'node:path';

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  async organize(artifactId: string, template: string, romsRoot = '/roms') {
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
    if (!artifact.library.autoOrganizeOnImport) {
      const src = path.join(artifact.library.path, artifact.path);
      return { path: src };
    }
    const organized = await moveArtifact(artifact as any, template, romsRoot);
    return { path: organized };
  }

  async activity() {
    return readActivity();
  }

  async retry(id: string) {
    await removeActivity(id);
    return { status: 'queued' };
  }
}
