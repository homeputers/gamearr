import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import type { Indexer, IndexerQuery, IndexerResult } from '@gamearr/domain';
import { throttledGet } from '../net/throttle.js';

interface RssMagnetOpts {
  key: string;
  name?: string;
  url: string;
  timeoutMs?: number;
}

export class RssMagnetIndexer implements Indexer {
  name: string;
  key: string;
  kind: 'rss' = 'rss';
  private url: string;
  private timeoutMs: number;

  constructor(opts: RssMagnetOpts) {
    this.key = opts.key;
    this.name = opts.name ?? opts.key;
    this.url = opts.url;
    this.timeoutMs = opts.timeoutMs ?? 10000;
  }

  private async fetch(): Promise<string | null> {
    try {
      if (this.url.startsWith('http://') || this.url.startsWith('https://')) {
        const res = await throttledGet(this.url, { timeoutMs: this.timeoutMs });
        if (!res.ok) return null;
        return await res.text();
      }
      // file path or file url
      const path = this.url.startsWith('file:')
        ? fileURLToPath(this.url)
        : this.url;
      return await readFile(path, 'utf-8');
    } catch {
      return null;
    }
  }

  async search(q: IndexerQuery): Promise<IndexerResult[]> {
    const xml = await this.fetch();
    if (!xml) return [];

    try {
      const parser = new XMLParser({ ignoreAttributes: false });
      const parsed = parser.parse(xml);
      let items: any[] = [];
      if (parsed?.rss?.channel?.item) {
        items = Array.isArray(parsed.rss.channel.item)
          ? parsed.rss.channel.item
          : [parsed.rss.channel.item];
      } else if (parsed?.feed?.entry) {
        items = Array.isArray(parsed.feed.entry)
          ? parsed.feed.entry
          : [parsed.feed.entry];
      }
      const titleQuery = q.title.toLowerCase();
      const results: IndexerResult[] = [];
      for (const item of items) {
        const titleRaw = item.title?.['#text'] ?? item.title;
        const title = typeof titleRaw === 'string' ? titleRaw : '';
        let linkRaw: any = item.link;
        if (Array.isArray(linkRaw)) linkRaw = linkRaw[0];
        const link =
          typeof linkRaw === 'object'
            ? linkRaw['@_href'] ?? linkRaw['#text'] ?? linkRaw
            : linkRaw;
        if (typeof link !== 'string' || !link.startsWith('magnet:')) continue;
        if (title && !title.toLowerCase().includes(titleQuery)) continue;
        const pubDate =
          item.pubDate || item.published || item.updated || undefined;
        results.push({
          indexer: this.key,
          id: link,
          title,
          platform: q.platform,
          protocol: 'torrent',
          link,
          publishedAt: pubDate,
        });
      }
      return results;
    } catch {
      return [];
    }
  }
}

export function createRssMagnetIndexer(opts: RssMagnetOpts): RssMagnetIndexer {
  return new RssMagnetIndexer(opts);
}

export default createRssMagnetIndexer;

