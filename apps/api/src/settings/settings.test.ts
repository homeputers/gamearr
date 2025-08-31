import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const NestTest = await import('@nestjs/testing');

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'settings-'));
process.env.DOWNLOADS_ROOT = tmpRoot;
process.env.DATA_ROOT = tmpRoot;
process.env.SETTINGS_KEY = 'testkey';

const setup = async () => {
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
  return { tmp: tmpRoot, app, port };
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

test('PUT /settings/providers saves settings', async () => {
  const { tmp, app, port } = await setup();
  const body = {
    providers: { rawgKey: 'key' },
    features: { experimental: true },
  };
  const res = await fetch(`http://localhost:${port}/settings/providers`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  assert.equal(json.providers.rawgKey, 'key');
  const file = await fs.readFile(path.join(tmp, 'settings.json'), 'utf8');
  const parsed = JSON.parse(file);
  assert.equal(parsed.providers.rawgKey, 'key');
  const getRes = await fetch(`http://localhost:${port}/settings/providers`);
  const got = await getRes.json();
  assert.equal(got.providers.rawgKey, 'key');
  assert.equal(got.features.experimental, true);
  await app.close();
});

test('PUT /settings/downloads/qbit encrypts password', async () => {
  const { tmp, app, port } = await setup();
  const body = { baseUrl: 'http://qb', username: 'u', password: 'p', category: 'c' };
  const res = await fetch(`http://localhost:${port}/settings/downloads/qbit`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const saved = await res.json();
  assert.equal(saved.baseUrl, 'http://qb');
  const file = await fs.readFile(path.join(tmp, 'settings.json'), 'utf8');
  const parsed = JSON.parse(file);
  assert.notEqual(parsed.downloads.qbittorrent.password, 'p');
  const getRes = await fetch(`http://localhost:${port}/settings/downloads/qbit`);
  const got = await getRes.json();
  assert.equal(got.password, 'p');
  await app.close();
});

