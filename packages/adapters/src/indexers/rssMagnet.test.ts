import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRssMagnetIndexer } from './rssMagnet.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const feedPath = path.resolve(
  __dirname,
  '../../../../test/fixtures/rss.xml'
);
const feedUrl = pathToFileURL(feedPath).href;

test('filters by title and returns magnet links', async () => {
  const ix = createRssMagnetIndexer({ key: 'test', url: feedUrl });
  const results = await ix.search({ title: 'Mario', platform: 'snes' });
  assert.equal(results.length, 1);
  assert.equal(results[0].title, 'Super Mario World (SNES)');
  assert.equal(results[0].link, 'magnet:?xt=urn:btih:SMW');
  assert.equal(results[0].platform, 'snes');
});
