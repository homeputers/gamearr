export interface IndexerQuery {
  title: string;
  platform: string;
  year?: number;
  regionPref?: string[];
}

export interface IndexerResult {
  id: string;
  title: string;
  platform: string;
  size?: number;
  seeders?: number;
  isPassworded?: boolean;
  link: string;
  protocol: 'torrent' | 'nzb';
  extra?: Record<string, unknown>;
}

export interface Indexer {
  name: string;
  search(q: IndexerQuery): Promise<IndexerResult[]>;
}
