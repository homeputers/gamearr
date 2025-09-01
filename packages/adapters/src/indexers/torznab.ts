import { XMLParser } from 'fast-xml-parser';
import type {
  Indexer,
  IndexerQuery,
  IndexerResult,
} from '@gamearr/domain';
import { throttledGet } from '../net/throttle.js';

interface TorznabOpts {
  key: string;
  name?: string;
  baseUrl: string;
  apiKey: string;
  indexerIds?: number[];
  categories?: number[];
  timeoutMs?: number;
}

export class TorznabIndexer implements Indexer {
  name: string;
  key: string;
  kind: 'torznab' = 'torznab';
  private baseUrl: string;
  private apiKey: string;
  private indexerIds?: number[];
  private categories?: number[];
  private timeoutMs: number;

  constructor(opts: TorznabOpts) {
    this.key = opts.key;
    this.name = opts.name ?? opts.key;
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.apiKey = opts.apiKey;
    this.indexerIds = opts.indexerIds;
    this.categories = opts.categories;
    this.timeoutMs = opts.timeoutMs ?? 10000;
  }

  private async request(params: Record<string, string>): Promise<string | null> {
    const searchParams = new URLSearchParams({ apikey: this.apiKey, ...params });
    if (this.categories?.length && !searchParams.has('cat')) {
      searchParams.set('cat', this.categories.join(','));
    }
    if (this.indexerIds?.length && !searchParams.has('indexerIds')) {
      searchParams.set('indexerIds', this.indexerIds.join(','));
    }
    const url = `${this.baseUrl}/api?${searchParams.toString()}`;
    try {
      const res = await throttledGet(url, { timeoutMs: this.timeoutMs });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }

  private parseItem(item: any, platform?: string): IndexerResult {
    const getAttr = (name: string): string | undefined => {
      const attrs = item['torznab:attr'];
      if (!attrs) return undefined;
      if (Array.isArray(attrs)) {
        const found = attrs.find((a: any) => a['@_name'] === name);
        return found?.['@_value'];
      }
      if (attrs['@_name'] === name) return attrs['@_value'];
      return undefined;
    };

    const magnet = getAttr('magneturl') || item.enclosure?.['@_url'];
    const size = item.size ?? getAttr('size') ?? item.enclosure?.['@_length'];
    const seeders = item.seeders ?? getAttr('seeders');
    const leechers = item.leechers ?? getAttr('leechers');

    let guid: string | undefined = item.guid;
    if (guid && typeof guid === 'object') {
      guid = guid['#text'];
    }

    const link = magnet && magnet.startsWith('magnet:') ? magnet : item.link;

    return {
      indexer: this.key,
      id: guid || link,
      title: item.title ?? '',
      platform,
      sizeBytes: size ? Number(size) : undefined,
      seeders: seeders ? Number(seeders) : undefined,
      leechers: leechers ? Number(leechers) : undefined,
      protocol: 'torrent',
      link,
      publishedAt: item.pubDate,
    };
  }

  async search(q: IndexerQuery): Promise<IndexerResult[]> {
    const params: Record<string, string> = {
      t: 'search',
      q: q.title,
    };
    if (this.categories?.length) {
      params.cat = this.categories.join(',');
    }
    const xml = await this.request(params);
    if (!xml) return [];

    try {
      const parser = new XMLParser({ ignoreAttributes: false });
      const parsed = parser.parse(xml);
      const items = parsed?.rss?.channel?.item;
      if (!items) return [];
      const arr = Array.isArray(items) ? items : [items];
      return arr.map((item: any) => this.parseItem(item, q.platform));
    } catch {
      return [];
    }
  }

  async getById(id: string): Promise<IndexerResult | null> {
    const xml = await this.request({ t: 'details', id });
    if (!xml) return null;
    try {
      const parser = new XMLParser({ ignoreAttributes: false });
      const parsed = parser.parse(xml);
      const item = parsed?.rss?.channel?.item;
      if (!item) return null;
      const target = Array.isArray(item) ? item[0] : item;
      return this.parseItem(target);
    } catch {
      return null;
    }
  }
}

export function createTorznabIndexer(opts: TorznabOpts): TorznabIndexer {
  return new TorznabIndexer(opts);
}

export default createTorznabIndexer;
