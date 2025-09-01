export interface RequestOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export async function get(url: string, opts: RequestOptions = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 10000);
  try {
    const res = await fetch(url, {
      headers: opts.headers,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}
