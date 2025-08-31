import { Injectable, Inject } from '@nestjs/common';
import {
  listIndexers,
  getIndexer,
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

  async search(
    q: SearchQuery,
  ): Promise<(IndexerResult & { indexer: string })[]> {
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
              size:
                typeof r.size === 'number'
                  ? r.size
                  : r.size
                    ? Number(r.size)
                    : 0,
              seeders:
                typeof r.seeders === 'number'
                  ? r.seeders
                  : r.seeders
                    ? Number(r.seeders)
                    : 0,
              isPassworded: r.isPassworded ?? false,
            };
            const withIndexer = { indexer: idx.name, ...normalized };
            this.cache.set(`${idx.name}:${r.id}`, normalized);
            return withIndexer;
          });
        }),
      )
    ).flat();

    results.sort((a, b) => {
      if (a.isPassworded !== b.isPassworded)
        return a.isPassworded ? 1 : -1;
      if ((a.seeders ?? 0) !== (b.seeders ?? 0))
        return (b.seeders ?? 0) - (a.seeders ?? 0);
      return (a.size ?? 0) - (b.size ?? 0);
    });

    return results;
  }

  async downloadFromSearch(
    indexerName: string,
    id: string,
    category?: string,
  ) {
    const key = `${indexerName}:${id}`;
    let result = this.cache.get(key);
    if (!result) {
      const indexer = getIndexer(indexerName);
      if (!indexer) {
        throw new Error('Indexer not found');
      }
      const res = await indexer.search({ title: '', platform: '' });
      result = res.find((r) => r.id === id);
      if (!result) {
        throw new Error('Result not found');
      }
    }
    if (!result.link.startsWith('magnet:')) {
      throw new Error('Unsupported link');
    }
    return this.downloads.addMagnet(result.link, category);
  }
}

