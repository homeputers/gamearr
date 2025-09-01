import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { Test as NestTest } from '@nestjs/testing';
import { OrganizeController } from './organize.controller.js';
import { OrganizeService } from './organize.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const artifact = {
  id: '1',
  path: 'Sonic.bin',
  multiPartGroup: null,
  library: { path: '/library', platform: { name: 'Dreamcast' } },
  release: { game: { title: 'Sonic' } },
};

test('POST /organize/preview returns path', async () => {
  const prismaStub = {
    artifact: {
      findUnique: async () => artifact,
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
  const res = await fetch(`http://localhost:${port}/organize/preview`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ artifactId: '1', template, romsRoot: '/roms' }),
  });
  const json = await res.json();
  assert.equal(json.path, path.join('/roms', 'Dreamcast/Sonic.bin'));
  await app.close();
});

