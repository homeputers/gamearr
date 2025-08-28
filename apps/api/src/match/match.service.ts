import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { rawg } from '@gamearr/adapters';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MatchService {
  private readonly providers = {
    rawg,
  };

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findUnmatched(skip: number, take: number) {
    return this.prisma.artifact.findMany({
      where: { releaseId: null },
      skip,
      take,
    });
  }

  async matchArtifact(
    id: string,
    provider: string,
    providerId: string,
  ) {
    const artifact = await this.prisma.artifact.findUnique({ where: { id } });
    if (!artifact) {
      throw new NotFoundException('Artifact not found');
    }
    const providerApi = (this.providers as any)[provider];
    if (!providerApi) {
      throw new NotFoundException('Unknown provider');
    }
    const gameData = await providerApi.getGame(providerId);
    let game = await this.prisma.game.findFirst({
      where: { provider, providerId },
    });
    if (!game) {
      game = await this.prisma.game.create({
        data: { title: gameData.title, provider, providerId },
      });
    }
    const release = await this.prisma.release.create({
      data: { gameId: game.id },
    });
    await this.prisma.artifact.update({
      where: { id: artifact.id },
      data: { releaseId: release.id },
    });
    return { game, release };
  }
}
