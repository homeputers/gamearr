import pino, { multistream, type Level } from 'pino';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const store = new AsyncLocalStorage<string>();

const logDir = resolve(process.cwd(), 'logs');
mkdirSync(logDir, { recursive: true });
export const logFilePath = resolve(logDir, 'app.log');

const streams = multistream([
  { stream: pino.destination({ dest: logFilePath, minLength: 4096, sync: false }) },
  { stream: process.stdout },
]);

const level = (process.env.LOG_LEVEL as Level | undefined) ??
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

export const logger = pino({
  level,
  redact: {
    paths: ['req.headers.authorization', '*.token', 'token', '*.password', 'password'],
    censor: '[Redacted]',
  },
  mixin() {
    const correlationId = store.getStore();
    return correlationId ? { correlationId } : {};
  },
}, streams);

export function withCorrelationId<T>(fn: () => T, id: string = randomUUID()): T {
  return store.run(id, fn);
}

// Backwards compatibility
export const withRequestId = withCorrelationId;

export default logger;
