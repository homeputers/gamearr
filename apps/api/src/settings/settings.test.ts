import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const NestTest = await import('@nestjs/testing');

const setup = async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'settings-'));
  process.env.DOWNLOADS_ROOT = tmp;
  const { SettingsController } = await import('./settings.controller.js');
  const { SettingsService } = await import('./settings.service.js');
  const moduleRef = await NestTest.Test.createTestingModule({
    controllers: [SettingsController],
    providers: [SettingsService],
  }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  await app.listen(0);
  const server = app.getHttpServer();
  const { port } = server.address();
  return { tmp, app, port };
};

test('PUT /settings/organize saves template', async () => {
  const { tmp, app, port } = await setup();
  const res = await fetch(`http://localhost:${port}/settings/organize`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ template: '${game}' }),
  });
  const json = await res.json();
  assert.equal(json.template, '${game}');
  const file = await fs.readFile(path.join(tmp, 'settings.json'), 'utf8');
  const parsed = JSON.parse(file);
  assert.equal(parsed.organizeTemplate, '${game}');
  await app.close();
});

test('PUT /settings/organize validates template', async () => {
  const { app, port } = await setup();
  const res = await fetch(`http://localhost:${port}/settings/organize`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ template: '${' }),
  });
  assert.equal(res.status, 400);
  await app.close();
});

