import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createTorznabIndexer } from './torznab.js';

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Super Mario World</title>
      <guid>abc123</guid>
      <link>magnet:?xt=urn:btih:SMW</link>
      <size>4096</size>
      <seeders>20</seeders>
      <leechers>1</leechers>
    </item>
  </channel>
</rss>`;

test('torznab search includes indexerIds and parses results', async () => {
  let lastUrl = '';
  const server = createServer((req, res) => {
    lastUrl = req.url || '';
    res.setHeader('Content-Type', 'application/xml');
    res.end(xml);
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as any).port;

  const ix = createTorznabIndexer({
    key: 'test',
    baseUrl: `http://127.0.0.1:${port}`,
    apiKey: 'abc',
    indexerIds: [1, 2],
  });

  const results = await ix.search({ title: 'Mario', platform: 'snes' });
  assert.equal(results.length, 1);
  assert.equal(results[0].title, 'Super Mario World');
  const url1 = new URL(`http://x${lastUrl}`);
  assert.equal(url1.searchParams.get('indexerIds'), '1,2');

  const byId = await ix.getById('abc123');
  assert(byId);
  const url2 = new URL(`http://x${lastUrl}`);
  assert.equal(url2.searchParams.get('indexerIds'), '1,2');

  server.close();
});
