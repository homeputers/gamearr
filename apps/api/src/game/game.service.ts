import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface GameFilters {
  platforms?: string[];
  regions?: string[];
  yearStart?: number;
  yearEnd?: number;
  q?: string;
}

@Injectable()
export class GameService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(filters: GameFilters) {
    const { platforms, regions, q } = filters;
    const releases = await this.prisma.release.findMany({
      where: {
        ...(regions && regions.length ? { region: { in: regions } } : {}),
        ...(q ? { game: { title: { contains: q, mode: 'insensitive' } } } : {}),
        ...(platforms && platforms.length
          ? { artifacts: { some: { library: { platformId: { in: platforms } } } } }
          : {}),
      },
      include: {
        game: true,
        artifacts: {
          include: {
            library: {
              include: { platform: true },
            },
          },
        },
      },
    });

    return releases.map((r: any) => ({
      id: r.id,
      title: r.game.title,
      platform: r.artifacts[0]?.library.platform.name,
      year: undefined,
      coverUrl: undefined,
      region: r.region ?? undefined,
      language: r.language ?? undefined,
      languages: r.language
        ? r.language.split(',').map((l: string) => l.trim()).filter(Boolean)
        : [],
    }));
  }
}

