import { z } from 'zod';

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
