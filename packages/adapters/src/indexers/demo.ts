import type { Indexer, IndexerQuery, IndexerResult } from '@gamearr/domain';

const data: IndexerResult[] = [
  {
    indexer: 'demo',
    id: 'snes-1',
    title: 'Super Mario World',
    platform: 'snes',
    sizeBytes: 4096,
    seeders: 20,
    link: 'magnet:?xt=urn:btih:SMW',
    protocol: 'torrent',
  },
  {
    indexer: 'demo',
    id: 'snes-2',
    title: 'The Legend of Zelda: A Link to the Past',
    platform: 'snes',
    sizeBytes: 4096,
    seeders: 15,
    link: 'magnet:?xt=urn:btih:ZELDA',
    protocol: 'torrent',
  },
  {
    indexer: 'demo',
    id: 'snes-3',
    title: 'Super Metroid',
    platform: 'snes',
    sizeBytes: 4096,
    seeders: 10,
    link: 'magnet:?xt=urn:btih:METROID',
    protocol: 'torrent',
  },
];

export const demo: Indexer = {
  name: 'Demo',
  key: 'demo',
  kind: 'custom',
  async search(q: IndexerQuery): Promise<IndexerResult[]> {
    return data.filter((r) => {
      const titleMatch =
        !q.title || r.title.toLowerCase().includes(q.title.toLowerCase());
      const platformMatch = !q.platform || r.platform === q.platform;
      return titleMatch && platformMatch;
    });
  },
  async getById(id: string): Promise<IndexerResult | null> {
    return data.find((r) => r.id === id) ?? null;
  },
};

export default demo;
