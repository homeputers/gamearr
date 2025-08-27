import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { moveArtifact } from '@gamearr/domain';
// Import Prisma dynamically to handle ESM/CommonJS compatibility
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// Create a token for dependency injection
export const PRISMA_CLIENT = 'PRISMA_CLIENT';

@Injectable()
export class ImportsService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: any) {}

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
    const path = await moveArtifact(artifact as any, template, romsRoot);
    return { path };
  }
}
