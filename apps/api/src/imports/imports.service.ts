import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { moveArtifact } from '@gamearr/domain';

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaClient) {}

  async organize(artifactId: string, template: string) {
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
    const path = await moveArtifact(artifact as any, template);
    return { path };
  }
}
