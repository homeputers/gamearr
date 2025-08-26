import pino from 'pino';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

const store = new AsyncLocalStorage<string>();

export const logger = pino({
  mixin() {
    const requestId = store.getStore();
    return requestId ? { requestId } : {};
  },
});

export function withRequestId<T>(fn: () => T, requestId: string = randomUUID()): T {
  return store.run(requestId, fn);
}

export default logger;
