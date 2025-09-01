import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { Test as NestTest } from '@nestjs/testing';
import { OrganizeController } from './organize.controller.js';
import { OrganizeService } from './organize.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

test('POST /organize/library/:id dryRun returns renames', async () => {
  const artifact = {
    id: '1',
    path: 'Sonic.bin',
    multiPartGroup: null,
    library: { id: 'lib', path: '/library', platform: { name: 'Dreamcast' } },
    release: { game: { title: 'Sonic' } },
  };
  const prismaStub = {
    artifact: {
      findMany: async () => [artifact],
    },
  };
  const moduleRef = await NestTest.createTestingModule({
    controllers: [OrganizeController],
    providers: [OrganizeService, { provide: PrismaService, useValue: prismaStub }],
  }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  await app.listen(0);
  const server = app.getHttpServer();
  const { port } = server.address();
  const template = '${game}${disc? ` (Disc ${disc})`:``}';
  const res = await fetch(`http://localhost:${port}/organize/library/lib`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ template, dryRun: true, romsRoot: '/roms' }),
  });
  const json = await res.json();
  assert.deepEqual(json.renames, [
    {
      from: path.join('/library', 'Sonic.bin'),
      to: path.join('/roms', 'Dreamcast/Sonic.bin'),
    },
  ]);
  await app.close();
});

test('POST /organize/library/:id moves files', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'organize-lib-'));
  const libraryPath = path.join(tmp, 'library');
  await fs.mkdir(libraryPath, { recursive: true });
  const source = path.join(libraryPath, 'Sonic.bin');
  await fs.writeFile(source, 'data');
  const romsRoot = path.join(tmp, 'roms');
  await fs.mkdir(path.join(romsRoot, 'Dreamcast'), { recursive: true });
  const artifact = {
    id: '1',
    path: 'Sonic.bin',
    multiPartGroup: null,
    library: { id: 'lib', path: libraryPath, platform: { name: 'Dreamcast' } },
    release: { game: { title: 'Sonic' } },
  };
  const prismaStub = {
    artifact: {
      findMany: async () => [artifact],
    },
  };
  const moduleRef = await NestTest.createTestingModule({
    controllers: [OrganizeController],
    providers: [OrganizeService, { provide: PrismaService, useValue: prismaStub }],
  }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  await app.listen(0);
  const server = app.getHttpServer();
  const { port } = server.address();
  const template = '${game}${disc? ` (Disc ${disc})`:``}';
  const res = await fetch(`http://localhost:${port}/organize/library/lib`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ template, romsRoot }),
  });
  const json = await res.json();
  assert.equal(json.renames[0].to, path.join(romsRoot, 'Dreamcast/Sonic.bin'));
  const moved = await fs.readFile(path.join(romsRoot, 'Dreamcast/Sonic.bin'), 'utf8');
  assert.equal(moved, 'data');
  await app.close();
});
