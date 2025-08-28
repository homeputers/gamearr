import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { moveArtifact } from '@gamearr/domain';
import { readImportActivity } from '@gamearr/shared';
// Import the shared Prisma DI token
import { PRISMA_CLIENT } from '../prisma/prisma.module';

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

  async activity() {
    return readImportActivity();
  }
}
