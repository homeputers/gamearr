import type { Indexer, IndexerQuery, IndexerResult } from '@gamearr/domain';

const data: IndexerResult[] = [
  {
    id: 'snes-1',
    title: 'Super Mario World',
    platform: 'snes',
    size: 4096,
    seeders: 20,
    link: 'magnet:?xt=urn:btih:SMW',
    protocol: 'torrent',
  },
  {
    id: 'snes-2',
    title: 'The Legend of Zelda: A Link to the Past',
    platform: 'snes',
    size: 4096,
    seeders: 15,
    link: 'magnet:?xt=urn:btih:ZELDA',
    protocol: 'torrent',
  },
  {
    id: 'snes-3',
    title: 'Super Metroid',
    platform: 'snes',
    size: 4096,
    seeders: 10,
    link: 'magnet:?xt=urn:btih:METROID',
    protocol: 'torrent',
  },
];

export const demo: Indexer = {
  name: 'demo',
  async search(q: IndexerQuery): Promise<IndexerResult[]> {
    return data.filter(r => {
      const titleMatch = !q.title || r.title.toLowerCase().includes(q.title.toLowerCase());
      const platformMatch = !q.platform || r.platform === q.platform;
      return titleMatch && platformMatch;
    });
  },
};

export default demo;
