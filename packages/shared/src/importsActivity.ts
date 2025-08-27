import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';

export interface ImportActivityEntry {
  file: string;
  status: 'imported' | 'error';
  reason?: string;
  hash?: string;
  timestamp: string;
}

function activityPath() {
  const root = config.paths.downloadsRoot || '.';
  return path.join(root, 'activity.json');
}

export async function readImportActivity(): Promise<ImportActivityEntry[]> {
  try {
    const raw = await fs.readFile(activityPath(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function addImportActivity(entry: ImportActivityEntry) {
  const list = await readImportActivity();
  list.push(entry);
  await fs.writeFile(activityPath(), JSON.stringify(list, null, 2));
}
