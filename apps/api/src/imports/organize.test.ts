import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { Test as NestTest } from '@nestjs/testing';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { ImportsController } from './imports.controller.js';
import { ImportsService, PRISMA_CLIENT } from './imports.service.js';

test('POST /imports/organize moves artifact', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'organize-'));
  const libraryPath = path.join(tmp, 'library');
  await fs.mkdir(libraryPath, { recursive: true });
  const source = path.join(libraryPath, 'Sonic.bin');
  await fs.writeFile(source, 'data');
  // Create a temporary directory for output instead of using /roms
  const romsPath = path.join(tmp, 'roms');
  await fs.mkdir(path.join(romsPath, 'Dreamcast'), { recursive: true });

  const artifact = {
    id: '1',
    path: 'Sonic.bin',
    multiPartGroup: null,
    library: { path: libraryPath, platform: { name: 'Dreamcast' } },
    release: { game: { title: 'Sonic' } },
  };

  const prismaStub = {
    artifact: {
      findUnique: async () => artifact,
    },
  };

  const moduleRef = await NestTest.createTestingModule({
    controllers: [ImportsController],
    providers: [ImportsService, { provide: PRISMA_CLIENT, useValue: prismaStub }],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  await app.listen(0);
  const server = app.getHttpServer();
  const { port } = server.address();

  const template = '${game}${disc? ` (Disc ${disc})`:``}';
  const res = await fetch(`http://localhost:${port}/imports/organize`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ artifactId: '1', template, romsRoot: romsPath }),
  });
  const json = await res.json();
  assert.equal(json.path, path.join(romsPath, 'Dreamcast/Sonic.bin'));
  const moved = await fs.readFile(path.join(romsPath, 'Dreamcast/Sonic.bin'), 'utf8');
  assert.equal(moved, 'data');
  await app.close();
});
