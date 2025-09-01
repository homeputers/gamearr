import test from 'node:test';
import assert from 'node:assert/strict';
import type { Indexer, IndexerQuery, IndexerResult } from '@gamearr/domain';

class MockDownloadsService {}

test('search dedupes, scores and respects limit', async () => {
  process.env.DATA_ROOT = '/tmp';
  process.env.DOWNLOADS_ROOT = '/tmp';
  const { registerIndexer, unregisterIndexer, listIndexers } = await import('@gamearr/domain');
  const { SearchService } = await import('./search.service.js');

  listIndexers().forEach((ix: Indexer) => unregisterIndexer(ix.key));

  const ix1: Indexer = {
    name: 'A',
    key: 'a',
    kind: 'custom',
    async search(q: IndexerQuery): Promise<IndexerResult[]> {
      return [
        {
          indexer: 'a',
          id: '1',
          title: q.title,
          protocol: 'torrent',
          infoHash: 'HASH1',
          seeders: 10,
        },
        {
          indexer: 'a',
          id: '2',
          title: q.title,
          protocol: 'torrent',
          infoHash: 'UNIQUE',
          seeders: 5,
          link: 'magnet:?xt=urn:btih:UNIQUE',
        },
      ];
    },
  };
  const ix2: Indexer = {
    name: 'B',
    key: 'b',
    kind: 'custom',
    async search(q: IndexerQuery): Promise<IndexerResult[]> {
      return [
        {
          indexer: 'b',
          id: '3',
          title: q.title,
          protocol: 'torrent',
          infoHash: 'HASH1',
          seeders: 20,
          link: 'magnet:?xt=urn:btih:HASH1',
        },
      ];
    },
  };

  registerIndexer(ix1);
  registerIndexer(ix2);

  const service = new SearchService(new MockDownloadsService() as any);
  const { results } = await service.search({ title: 'Mario', platform: 'snes' });

  assert.equal(results.length, 2);
  assert.equal(results[0].infoHash, 'HASH1');
  assert.equal(results[0].seeders, 20);
  assert.ok(results[0].link);
  assert.equal(results[1].infoHash, 'UNIQUE');
  assert.ok(results[0].score >= results[1].score);

  const limited = await service.search({ title: 'Mario', platform: 'snes', limit: 1 });
  assert.equal(limited.results.length, 1);
});
