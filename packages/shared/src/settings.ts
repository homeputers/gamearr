import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
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
    const parsed = settingsSchema.parse(json);
    const pw = parsed.downloads.qbittorrent.password;
    if (pw) {
      try {
        parsed.downloads.qbittorrent.password = decrypt(pw);
      } catch {
        // ignore decryption errors
      }
    }
    return parsed;
  } catch {
    return settingsSchema.parse({});
  }
}

export async function writeSettings(settings: Settings) {
  const clone: Settings = JSON.parse(JSON.stringify(settings));
  const pw = clone.downloads.qbittorrent.password;
  if (pw) {
    clone.downloads.qbittorrent.password = encrypt(pw);
  }
  await fs.writeFile(settingsPath(), JSON.stringify(clone, null, 2));
}

function encrypt(text: string): string {
  const key = crypto.createHash('sha256').update(config.settingsKey).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(data: string): string {
  const [ivHex, encHex] = data.split(':');
  const key = crypto.createHash('sha256').update(config.settingsKey).digest();
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

