import pino from 'pino';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

const store = new AsyncLocalStorage<string>();

export const logger = pino({
  redact: {
    paths: ['req.headers.authorization', '*.token', 'token', '*.password', 'password'],
    censor: '[Redacted]',
  },
  mixin() {
    const correlationId = store.getStore();
    return correlationId ? { correlationId } : {};
  },
});

export function withCorrelationId<T>(fn: () => T, id: string = randomUUID()): T {
  return store.run(id, fn);
}

// Backwards compatibility
export const withRequestId = withCorrelationId;

export default logger;
