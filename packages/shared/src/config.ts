import { z } from 'zod';
import { createRequire } from 'node:module';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../..', '.env');
if (process.env.NODE_ENV !== 'test') {
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
}

const envSchema = z.object({
  DB_URL: z.string().url().optional(),
  REDIS_URL: z.string().optional(),
  LIB_ROOT: z.string().optional(),
  DOWNLOADS_ROOT: z.string().optional(),
  DATA_ROOT: z.string().min(1),
  MAX_DAT_UPLOAD_MB: z.coerce.number().int().positive().default(512),
  DAT_PRUNE_KEEP: z.coerce.number().int().nonnegative().default(2),
});

const env = envSchema.parse(process.env);

const datRoot = join(env.DATA_ROOT, 'dats');

export const config = {
  dbUrl: env.DB_URL,
  redisUrl: env.REDIS_URL,
  maxDatUploadMB: env.MAX_DAT_UPLOAD_MB,
  datPruneKeep: env.DAT_PRUNE_KEEP,
  paths: {
    libRoot: env.LIB_ROOT,
    downloadsRoot: env.DOWNLOADS_ROOT,
    datRoot,
    platformDatDir: (platformId: string) => join(datRoot, platformId),
  },
};

export type Config = typeof config;

export default config;
