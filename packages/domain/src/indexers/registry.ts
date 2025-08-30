import type { Indexer } from './types.js';

const registry = new Map<string, Indexer>();

export function registerIndexer(indexer: Indexer): void {
  registry.set(indexer.name, indexer);
}

export function listIndexers(): Indexer[] {
  return Array.from(registry.values());
}

export function getIndexer(name: string): Indexer | undefined {
  return registry.get(name);
}
