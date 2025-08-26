// @ts-nocheck
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashFile } from './hasher.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('hashFile computes stable hashes', async () => {
  const file = path.resolve(__dirname, '../../test/fixtures/sample.bin');
  const result = await hashFile(file);
  assert.equal(result.size, 19);
  assert.equal(result.crc32, 'a0f95d33');
  assert.equal(result.sha1, '65ea0164c91de2197956ed143099b90ff37d699e');
});
