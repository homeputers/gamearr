import type { Indexer } from './types.js';

const REG = new Map<string, Indexer>();

export function registerIndexer(ix: Indexer) {
  REG.set(ix.key, ix);
}

export function getIndexer(key: string) {
  return REG.get(key);
}

export function listIndexers() {
  return Array.from(REG.values());
}

