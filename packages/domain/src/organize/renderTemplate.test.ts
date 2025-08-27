import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTemplate } from './renderTemplate.js';

test('renders variables', () => {
  const result = renderTemplate({ name: 'World' }, 'Hello ${name}');
  assert.equal(result, 'Hello World');
});

test('missing variables become empty', () => {
  const result = renderTemplate({}, 'Hello ${name}!');
  assert.equal(result, 'Hello !');
});

test('supports simple ternaries', () => {
  const tpl = 'Game${disc? ` (Disc ${disc})`:``}';
  assert.equal(renderTemplate({ disc: 1 }, tpl), 'Game (Disc 1)');
  assert.equal(renderTemplate({}, tpl), 'Game');
});
