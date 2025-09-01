import { get, type RequestOptions } from '../http.js';

interface Bucket {
  tokens: number;
  last: number;
}

const buckets = new Map<string, Bucket>();

function refill(bucket: Bucket, rate: number) {
  const now = Date.now();
  const interval = 1000 / rate;
  const delta = now - bucket.last;
  const add = Math.floor(delta / interval);
  if (add > 0) {
    bucket.tokens = Math.min(rate, bucket.tokens + add);
    bucket.last = now;
  }
}

async function acquire(base: string, rate: number) {
  let bucket = buckets.get(base);
  if (!bucket) {
    bucket = { tokens: rate, last: Date.now() };
    buckets.set(base, bucket);
  } else {
    refill(bucket, rate);
  }
  const interval = 1000 / rate;
  while (bucket.tokens <= 0) {
    await new Promise((r) => setTimeout(r, interval));
    refill(bucket, rate);
  }
  bucket.tokens -= 1;
}

export async function throttledGet(
  url: string,
  opts: RequestOptions & { rate?: number } = {},
): Promise<Response> {
  const rate = opts.rate ?? 5;
  const base = new URL(url).origin;
  let res: Response | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    await acquire(base, rate);
    res = await get(url, opts);
    if (res.status !== 429 && res.status !== 503) {
      return res;
    }
    const delay = Math.pow(2, attempt) * 1000;
    await new Promise((r) => setTimeout(r, delay));
  }
  return res!;
}
