import { z } from 'zod';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../..', '.env');
try {
  require('dotenv').config({ path: envPath });
} catch {
  try {
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
      if (match && process.env[match[1]] === undefined) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {
    // ignore if dotenv and fallback both fail
  }
}

const envSchema = z.object({
  DB_URL: z.string().url().optional(),
  REDIS_URL: z.string().optional(),
  RAWG_KEY: z.string().optional(),
  IGDB_CLIENT_ID: z.string().optional(),
  IGDB_CLIENT_SECRET: z.string().optional(),
  LIB_ROOT: z.string().optional(),
  DOWNLOADS_ROOT: z.string().optional(),
});

const env = envSchema.parse(process.env);

export const config = {
  dbUrl: env.DB_URL,
  redisUrl: env.REDIS_URL,
  rawgKey: env.RAWG_KEY,
  igdb: {
    clientId: env.IGDB_CLIENT_ID,
    clientSecret: env.IGDB_CLIENT_SECRET,
  },
  paths: {
    libRoot: env.LIB_ROOT,
    downloadsRoot: env.DOWNLOADS_ROOT,
  },
};

export type Config = typeof config;

export default config;
