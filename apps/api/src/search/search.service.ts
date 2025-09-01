import { Injectable } from '@nestjs/common';
import {
  listIndexers,
  score,
  type IndexerResult,
  type IndexerQuery,
} from '@gamearr/domain';

interface SearchQuery {
  title: string;
  platform?: string;
  year?: number;
  regionPref?: string[];
  limit?: number;
}

interface SearchResult extends IndexerResult {
  score: number;
}

@Injectable()
export class SearchService {
  constructor() {}

  private cache = new Map<string, IndexerResult>();

  async search(q: SearchQuery): Promise<{ results: SearchResult[] }> {
    const limit = q.limit ?? 50;
    const query: IndexerQuery = {
      title: q.title,
      platform: q.platform ?? '',
      year: q.year,
      regionPref: q.regionPref,
      limit,
    };

    const indexers = listIndexers();
    const results = (
      await Promise.all(
        indexers.map(async (idx) => {
          const res = await idx.search(query);
          return res.map((r) => {
            const normalized: IndexerResult = {
              ...r,
              indexer: r.indexer ?? idx.key,
              sizeBytes:
                typeof r.sizeBytes === 'number'
                  ? r.sizeBytes
                  : r.sizeBytes
                    ? Number(r.sizeBytes)
                    : undefined,
              seeders:
                typeof r.seeders === 'number'
                  ? r.seeders
                  : r.seeders
                    ? Number(r.seeders)
                    : undefined,
              leechers:
                typeof r.leechers === 'number'
                  ? r.leechers
                  : r.leechers
                    ? Number(r.leechers)
                    : undefined,
              isPassworded: r.isPassworded ?? false,
            };
            this.cache.set(`${idx.key}:${r.id}`, normalized);
            return normalized;
          });
        }),
      )
    ).flat();

    const dedup = new Map<string, IndexerResult>();

    for (const r of results) {
      const key = r.infoHash ? `hash:${r.infoHash}` : `id:${r.indexer}:${r.id}`;
      const existing = dedup.get(key);
      if (existing) {
        if (!existing.link && r.link) {
          existing.indexer = r.indexer;
          existing.id = r.id;
          existing.link = r.link;
        }
        if (typeof r.seeders === 'number') {
          existing.seeders = Math.max(existing.seeders ?? 0, r.seeders);
        }
        if (typeof r.leechers === 'number') {
          existing.leechers = Math.max(existing.leechers ?? 0, r.leechers);
        }
        if (existing.sizeBytes === undefined && r.sizeBytes !== undefined) {
          existing.sizeBytes = r.sizeBytes;
        }
        if (!existing.verified && r.verified) {
          existing.verified = r.verified;
        }
        if (!existing.isPassworded && r.isPassworded) {
          existing.isPassworded = r.isPassworded;
        }
      } else {
        dedup.set(key, { ...r });
      }
    }

    const scored: SearchResult[] = Array.from(dedup.values()).map((r) => ({
      ...r,
      score: score({ ...r, regionPref: q.regionPref }),
    }));

    scored.sort((a, b) => b.score - a.score);

    return { results: scored.slice(0, limit) };
  }

}

