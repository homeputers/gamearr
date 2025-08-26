// @ts-nocheck
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { parseGdi } from './gdi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('parseGdi returns track metadata', async () => {
  const file = path.resolve(__dirname, '../../test/fixtures/sample.gdi');
  const content = await fs.readFile(file, 'utf8');
  const result = parseGdi(content);
  assert.equal(result.tracks.length, 3);
  assert.deepEqual(result.tracks[0], { track: 1, lba: 0, filename: 'track01.bin' });
});
