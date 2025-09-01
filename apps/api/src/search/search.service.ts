import { Injectable, Inject } from '@nestjs/common';
import {
  listIndexers,
  getIndexer,
  score,
  type IndexerResult,
  type IndexerQuery,
} from '@gamearr/domain';
import { DownloadsService } from '../downloads/downloads.service.js';

interface SearchQuery {
  title?: string;
  platform?: string;
  year?: number;
  regionPref?: string[];
}

@Injectable()
export class SearchService {
  constructor(
    @Inject(DownloadsService) private readonly downloads: DownloadsService,
  ) {}

  private cache = new Map<string, IndexerResult>();

  async search(q: SearchQuery): Promise<IndexerResult[]> {
    const query: IndexerQuery = {
      title: q.title ?? '',
      platform: q.platform ?? '',
      year: q.year,
      regionPref: q.regionPref,
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

    results.sort((a, b) => score(b) - score(a));

    return results;
  }

  async downloadFromSearch(indexerKey: string, id: string, category?: string) {
    const key = `${indexerKey}:${id}`;
    let result = this.cache.get(key);
    if (!result) {
      const indexer = getIndexer(indexerKey);
      if (!indexer) {
        throw new Error('Indexer not found');
      }
      if (indexer.getById) {
        result = (await indexer.getById(id)) ?? undefined;
      } else {
        const res = await indexer.search({ title: '', platform: '', limit: 1 });
        result = res.find((r) => r.id === id);
      }
      if (!result) {
        throw new Error('Result not found');
      }
    }
    if (!result.link || !result.link.startsWith('magnet:')) {
      throw new Error('Unsupported link');
    }
    return this.downloads.addMagnet(result.link, category);
  }
}

