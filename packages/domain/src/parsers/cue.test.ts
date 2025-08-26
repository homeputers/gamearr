// @ts-nocheck
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { parseCue } from './cue.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('parseCue returns file metadata', async () => {
  const file = path.resolve(__dirname, '../../test/fixtures/sample.cue');
  const content = await fs.readFile(file, 'utf8');
  const result = parseCue(content);
  assert.equal(result.files.length, 2);
  assert.deepEqual(result.files.map(f => f.filename), ['track01.bin', 'track02.bin']);
});
