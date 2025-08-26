// @ts-nocheck
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { walk } from './walk.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('walk respects ignore globs', async () => {
  const root = path.resolve(__dirname, '../../test/fixtures/walk');
  const files: string[] = [];
  for await (const file of walk(root, { ignore: ['ignore.txt', 'sub/**'] })) {
    files.push(path.relative(root, file));
  }
  assert.deepEqual(files.sort(), ['keep.txt']);
});
