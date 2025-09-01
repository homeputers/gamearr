export type Protocol = 'torrent' | 'nzb';

export interface IndexerQuery {
  title: string;
  platform: string; // internal platform slug
  year?: number;
  regionPref?: string[];
  limit?: number;
}

export interface IndexerResult {
  indexer: string; // indexer name/id
  id: string; // indexer-local id (or hash)
  title: string;
  platform?: string;
  year?: number;
  sizeBytes?: number;
  seeders?: number;
  leechers?: number;
  verified?: boolean;
  isPassworded?: boolean;
  protocol: Protocol;
  link?: string; // magnet / nzb URL if directly available
  infoHash?: string; // optional torrent hash
  publishedAt?: string;
  extra?: Record<string, unknown>;
}

export interface Indexer {
  name: string; // human friendly
  key: string; // unique key
  kind: 'torznab' | 'rss' | 'custom';
  search(q: IndexerQuery): Promise<IndexerResult[]>;
  getById?(id: string): Promise<IndexerResult | null>;
}

export interface ScoreInput extends IndexerResult {
  regionPref?: string[];
}

export function score(r: ScoreInput): number {
  const seed = r.seeders ?? 0;
  const sizePenalty = r.sizeBytes
    ? Math.log10(r.sizeBytes / (1024 * 1024))
    : 0;
  const passwdPenalty = r.isPassworded ? 5 : 0;
  return seed - sizePenalty - passwdPenalty + (r.verified ? 1 : 0);
}

