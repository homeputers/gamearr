// @ts-nocheck
import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface WalkOptions {
  ignore?: string[];
}

function globToRegExp(glob: string): RegExp {
  const esc = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '.*');
  return new RegExp(`^${esc}$`);
}

export async function* walk(root: string, options: WalkOptions = {}): AsyncGenerator<string> {
  const { ignore = [] } = options;
  const patterns = ignore.map(globToRegExp);

  async function* traverse(dir: string): AsyncGenerator<string> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full);
      if (patterns.some((r) => r.test(rel))) continue;
      if (entry.isDirectory()) {
        yield* traverse(full);
      } else if (entry.isFile()) {
        yield full;
      }
    }
  }

  yield* traverse(root);
}
