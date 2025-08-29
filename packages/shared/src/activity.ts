import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';

export type ActivityType = 'scan' | 'hash' | 'match' | 'import' | 'export' | 'error';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  timestamp: string;
  message?: string;
  details?: Record<string, unknown>;
  retry?: { path: string; method?: string };
}

function activityPath() {
  const root = config.paths.downloadsRoot || '.';
  return path.join(root, 'activity.json');
}

export async function readActivity(): Promise<ActivityEntry[]> {
  try {
    const raw = await fs.readFile(activityPath(), 'utf8');
    const list = JSON.parse(raw) as ActivityEntry[];
    return list.map((e, idx) => ({ ...e, id: e.id ?? String(idx) }));
  } catch {
    return [];
  }
}

export async function addActivity(entry: Omit<ActivityEntry, 'id'> & { id?: string }) {
  const list = await readActivity();
  const withId: ActivityEntry = { ...entry, id: entry.id ?? randomUUID() } as ActivityEntry;
  list.push(withId);
  await fs.writeFile(activityPath(), JSON.stringify(list, null, 2));
  return withId;
}

export async function removeActivity(id: string) {
  const list = await readActivity();
  const idx = list.findIndex((e) => e.id === id);
  if (idx >= 0) {
    list.splice(idx, 1);
    await fs.writeFile(activityPath(), JSON.stringify(list, null, 2));
  }
}
