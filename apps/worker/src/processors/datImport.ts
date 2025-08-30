import type { Job } from 'bullmq';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { XMLParser } from 'fast-xml-parser';
import prisma from '@gamearr/storage/src/client';
import { logger } from '@gamearr/shared';

const execFileAsync = promisify(execFile);

interface DatImportJob {
  datFileId: string;
}

interface ParsedEntry {
  name: string;
  crc?: string;
  md5?: string;
  sha1?: string;
  region?: string;
  languages?: string[];
  serial?: string;
  revision?: string;
}

function splitLanguages(input?: string): string[] | undefined {
  if (!input) return undefined;
  return input
    .split(/[,\/\\|;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function readDatXml(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.zip') {
    const { stdout: list } = await execFileAsync('unzip', ['-Z1', filePath]);
    const entry = list
      .toString()
      .split(/\r?\n/)
      .find((l: string) => l.endsWith('.dat') || l.endsWith('.xml'));
    if (!entry) throw new Error('no dat entry in zip');
    const { stdout } = await execFileAsync('unzip', ['-p', filePath, entry]);
    return stdout.toString();
  }
  if (ext === '.7z') {
    const { stdout: list } = await execFileAsync('7z', ['l', '-ba', filePath]);
    const entry = list
      .toString()
      .split(/\r?\n/)
      .map((l: string) => l.trim().split(/\s+/).pop() || '')
      .find((l) => l.endsWith('.dat') || l.endsWith('.xml'));
    if (!entry) throw new Error('no dat entry in 7z');
    const { stdout } = await execFileAsync('7z', ['x', '-so', filePath, entry]);
    return stdout.toString();
  }
  return await fs.readFile(filePath, 'utf8');
}

function parseDat(xml: string): { entries: ParsedEntry[]; version?: string; source: string } {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const doc = parser.parse(xml);
  const header = doc?.datafile?.header ?? {};
  const games = doc?.datafile?.game
    ? Array.isArray(doc.datafile.game)
      ? doc.datafile.game
      : [doc.datafile.game]
    : [];

  let source = 'unknown';
  const author = typeof header.author === 'string' ? header.author.toLowerCase() : '';
  if (author.includes('no-intro')) source = 'no-intro';
  else if (author.includes('redump')) source = 'redump';

  const entries: ParsedEntry[] = [];
  for (const game of games) {
    const roms = game.rom ? (Array.isArray(game.rom) ? game.rom : [game.rom]) : [];
    for (const rom of roms) {
      entries.push({
        name: rom.name || game.name,
        crc: rom.crc ? String(rom.crc).toLowerCase() : undefined,
        md5: rom.md5 ? String(rom.md5).toLowerCase() : undefined,
        sha1: rom.sha1 ? String(rom.sha1).toLowerCase() : undefined,
        region: game.region || game.location,
        languages: splitLanguages(game.languages || game.language),
        serial: game.serial || game.catalog || game.productcode,
        revision: rom.version || game.version,
      });
    }
  }

  return { entries, version: header.version, source };
}

export async function datImportProcessor(job: Job<DatImportJob>) {
  const start = Date.now();
  logger.info({ payload: job.data }, 'dat import job');
  const { datFileId } = job.data;
  const datFile = await prisma.datFile.findUnique({ where: { id: datFileId } });
  if (!datFile) throw new Error('DatFile not found');

  const xml = await readDatXml(datFile.path);
  const { entries, version, source } = parseDat(xml);

  const batchSize = 500;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    await prisma.$transaction(
      batch.map((e) =>
        prisma.datEntry.upsert({
          where: {
            datFileId_canonicalName: {
              datFileId,
              canonicalName: e.name,
            },
          },
          create: {
            datFileId,
            platformId: datFile.platformId,
            canonicalName: e.name,
            hashCrc: e.crc,
            hashMd5: e.md5,
            hashSha1: e.sha1,
            region: e.region,
            languages: e.languages || [],
            serial: e.serial,
            revision: e.revision,
            verified: true,
            source,
          },
          update: {
            hashCrc: e.crc,
            hashMd5: e.md5,
            hashSha1: e.sha1,
            region: e.region,
            languages: e.languages || [],
            serial: e.serial,
            revision: e.revision,
            verified: true,
            source,
          },
        }),
      ),
    );
  }

  if (version) {
    await prisma.datFile.update({ where: { id: datFileId }, data: { version } });
  }

  const duration = Date.now() - start;
  logger.info(
    { entries: entries.length, duration, platformId: datFile.platformId },
    'dat import complete',
  );
}

export default datImportProcessor;

