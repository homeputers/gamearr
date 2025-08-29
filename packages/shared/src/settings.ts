import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { config } from './config.js';

const providerSchema = z.object({
  rawgKey: z.string().optional(),
  igdbClientId: z.string().optional(),
  igdbClientSecret: z.string().optional(),
  tgdbApiKey: z.string().optional(),
});

const downloadClientSchema = z.object({
  baseUrl: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  category: z.string().optional(),
  label: z.string().optional(),
});

const settingsSchema = z.object({
  organizeTemplate: z.string().default('${game}${disc? ` (Disc ${disc})`:``}'),
  providers: providerSchema.default({}),
  downloads: z
    .object({
      qbittorrent: downloadClientSchema.default({}),
      transmission: downloadClientSchema.default({}),
      sab: downloadClientSchema.default({}),
    })
    .default({ qbittorrent: {}, transmission: {}, sab: {} }),
  features: z.record(z.boolean()).default({}),
});

export type Settings = z.infer<typeof settingsSchema>;

function settingsPath() {
  const root = config.paths.downloadsRoot || '.';
  return path.join(root, 'settings.json');
}

export async function readSettings(): Promise<Settings> {
  try {
    const raw = await fs.readFile(settingsPath(), 'utf8');
    const json = JSON.parse(raw);
    return settingsSchema.parse(json);
  } catch {
    return settingsSchema.parse({});
  }
}

export async function writeSettings(settings: Settings) {
  await fs.writeFile(settingsPath(), JSON.stringify(settings, null, 2));
}

