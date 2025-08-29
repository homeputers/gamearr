import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { readActivity } from '@gamearr/shared';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async summary() {
    const [games, unmatched] = await this.prisma.$transaction([
      this.prisma.game.count(),
      this.prisma.artifact.count({ where: { releaseId: null } }),
    ]);

    const activity = await readActivity();
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recent = activity.filter((e) => new Date(e.timestamp).getTime() >= weekAgo);
    const success = recent.filter((e) => e.type === 'import').length;
    const errors = recent.filter((e) => e.type === 'error').length;
    const total = success + errors;
    const importSuccessRate7d = total ? success / total : 0;

    const queueDepth = activity.length;
    const avgDownloadToImport = 0;

    return {
      games,
      unmatched,
      importSuccessRate7d,
      queueDepth,
      avgDownloadToImport,
    };
  }

  async timeseries() {
    const activity = await readActivity();
    const now = Date.now();
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
    const imports = activity.filter(
      (e) => e.type === 'import' && new Date(e.timestamp).getTime() >= twoWeeksAgo,
    );
    const perDay: Record<string, number> = {};
    for (const e of imports) {
      const date = e.timestamp.slice(0, 10);
      perDay[date] = (perDay[date] || 0) + 1;
    }
    const importsPerDay = Object.entries(perDay)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, count]) => ({ date, count }));

    return {
      importsPerDay,
      providerLatency: [],
    };
  }
}

