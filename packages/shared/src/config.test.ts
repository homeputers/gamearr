import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';

const VALID_ENV = {
  DB_URL: 'postgresql://user:pass@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  RAWG_KEY: 'rawg-key',
  IGDB_CLIENT_ID: 'client-id',
  IGDB_CLIENT_SECRET: 'client-secret',
  LIB_ROOT: '/library',
  DOWNLOADS_ROOT: '/downloads',
  DATA_ROOT: '/data',
};

const loadConfig = async () => import(`./config.js?${Date.now()}`);

const setEnv = (env: Record<string, string>) => {
  process.env = { NODE_ENV: 'test', ...env } as NodeJS.ProcessEnv;
};

test('parses configuration from env', async () => {
  const original = process.env;
  setEnv(VALID_ENV);
  const mod = await loadConfig();
  assert.equal(mod.config.dbUrl, VALID_ENV.DB_URL);
  assert.equal(mod.config.paths.datRoot, join('/data', 'dats'));
  assert.equal(mod.config.paths.platformDatDir('nes'), join('/data', 'dats', 'nes'));
  process.env = original;
});

test('returns undefined for missing vars', async () => {
  const original = process.env;
  const { DB_URL, ...rest } = VALID_ENV;
  setEnv(rest);
  const mod = await loadConfig();
  assert.equal(mod.config.dbUrl, undefined);
  process.env = original;
});
