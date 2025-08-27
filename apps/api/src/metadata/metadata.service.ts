import { Injectable } from '@nestjs/common';
import { rawg, igdb } from '@gamearr/adapters';

@Injectable()
export class MetadataService {
  private readonly providers = [
    { name: 'rawg', api: rawg },
    { name: 'igdb', api: igdb },
  ];

  async search(title: string, platform: string, year?: number) {
    const results = await Promise.all(
      this.providers.map(async (p) => {
        const items = await p.api.searchGame({ title, platform, year });
        return items.map((item, idx) => ({
          ...item,
          sources: [p.name],
          score: 1 / (idx + 1),
        }));
      })
    );

    const merged: Record<string, any> = {};
    for (const item of results.flat()) {
      const key = `${item.title.toLowerCase()}-${item.year ?? ''}`;
      const existing = merged[key];
      if (existing) {
        existing.sources.push(...item.sources);
        existing.score = Math.max(existing.score, item.score);
        if (!existing.coverUrl && item.coverUrl) {
          existing.coverUrl = item.coverUrl;
        }
      } else {
        merged[key] = { ...item };
      }
    }

    return Object.values(merged)
      .sort((a: any, b: any) => b.score - a.score)
      .map(({ score, ...rest }: any) => rest);
  }
}
