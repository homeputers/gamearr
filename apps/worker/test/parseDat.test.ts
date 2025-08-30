import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
process.env.DATA_ROOT = '/tmp';
const fixturePath = fileURLToPath(new URL('./fixtures/sample.dat', import.meta.url));

test('XML parser returns normalized entries', async () => {
  process.env.DATA_ROOT = '/tmp';
  const { parseDat } = await import('../src/processors/datImport.js');
  const xml = await readFile(fixturePath, 'utf8');
  const { entries, source, version } = parseDat(xml);
  assert.equal(entries.length, 2);
  assert.equal(source, 'no-intro');
  assert.equal(String(version), '1');
  assert.equal(entries[0].region, 'USA');
  assert.deepEqual(entries[0].languages, ['en', 'fr']);
  assert.equal(entries[0].serial, 'ABC123');
  assert.equal(entries[1].region, 'Europe');
  assert.deepEqual(entries[1].languages, ['es']);
  assert.equal(entries[1].serial, 'XYZ987');
  assert.equal(entries[1].revision, 'Rev 1');
});
