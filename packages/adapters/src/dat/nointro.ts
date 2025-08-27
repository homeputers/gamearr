import { XMLParser } from 'fast-xml-parser';

export interface NointroEntry {
  name: string;
  crc?: string;
  md5?: string;
  sha1?: string;
  region?: string;
  languages?: string;
  serial?: string;
}

export function parseNointroDat(xml: string): NointroEntry[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const doc = parser.parse(xml);
  const games = doc?.datafile?.game ? (Array.isArray(doc.datafile.game) ? doc.datafile.game : [doc.datafile.game]) : [];
  const entries: NointroEntry[] = [];
  for (const game of games) {
    const roms = game.rom ? (Array.isArray(game.rom) ? game.rom : [game.rom]) : [];
    for (const rom of roms) {
      entries.push({
        name: rom.name || game.name,
        crc: rom.crc ? String(rom.crc).toLowerCase() : undefined,
        md5: rom.md5 ? String(rom.md5).toLowerCase() : undefined,
        sha1: rom.sha1 ? String(rom.sha1).toLowerCase() : undefined,
        region: game.region,
        languages: game.languages,
        serial: game.serial,
      });
    }
  }
  return entries;
}

export async function loadNointroDat(url: string): Promise<NointroEntry[]> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`nointro dat fetch failed: ${res.status} ${text}`);
  }
  const xml = await res.text();
  return parseNointroDat(xml);
}
