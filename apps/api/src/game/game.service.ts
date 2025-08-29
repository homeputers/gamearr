import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { pickWinner } from '@gamearr/domain';

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

  async findDuplicates() {
    const games = await this.prisma.game.findMany({
      include: {
        releases: { include: { artifacts: true } },
      },
    });

    return games
      .map((g: any) => ({
        id: g.id,
        title: g.title,
        artifacts: g.releases.flatMap((r: any) =>
          r.artifacts.map((a: any) => ({
            id: a.id,
            preferred: a.preferred ?? false,
            region: r.region ?? undefined,
            revision: (r as any).revision ?? undefined,
            verified: (a as any).verified ?? undefined,
          })),
        ),
      }))
      .filter((g: any) => g.artifacts.length > 1);
  }

  async applyOneGameOneRom(
    overrides: Record<string, string>,
    dryRun: boolean,
  ) {
    const games = await this.findDuplicates();
    const prefs = {
      regionPriority: ['USA', 'Europe', 'Japan'],
      preferVerified: true,
      preferHighestRevision: true,
    };
    const changes: { artifactId: string; preferred: boolean }[] = [];
    for (const game of games as any[]) {
      let winnerId: string | undefined = overrides[game.id];
      if (!winnerId) {
        const mapped = game.artifacts.map((a: any) => ({
          id: a.id,
          release: { region: a.region },
          verified: a.verified,
          revision: a.revision,
        }));
        const { winner } = pickWinner(mapped, prefs);
        winnerId = winner?.id;
      }
      for (const art of game.artifacts) {
        const preferred = art.id === winnerId;
        if (art.preferred !== preferred) {
          changes.push({ artifactId: art.id, preferred });
          if (!dryRun) {
            await this.prisma.artifact.update({
              where: { id: art.id },
              data: { preferred } as any,
            });
          }
        }
      }
    }
    return { changes };
  }
}

