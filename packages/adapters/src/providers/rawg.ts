import { config } from '@gamearr/shared';

const BASE_URL = 'https://api.rawg.io/api';

async function rawgFetch(path: string, params: Record<string, string | number | undefined> = {}, attempt = 0): Promise<any> {
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  if (config.rawgKey) {
    url.searchParams.set('key', config.rawgKey);
  }

  const res = await fetch(url.toString());
  if (res.status === 429 && attempt < 3) {
    const retryAfter = parseInt(res.headers.get('Retry-After') || '1', 10);
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return rawgFetch(path, params, attempt + 1);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`RAWG request failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function searchGame({
  title,
  platform,
  year,
}: {
  title: string;
  platform: string;
  year?: number;
}): Promise<{ id: string; title: string; year?: number; coverUrl?: string }[]> {
  const params: Record<string, string> = {
    search: title,
    page_size: '10',
  };
  if (platform) {
    params.platforms = platform;
  }
  if (year) {
    params.dates = `${year}-01-01,${year}-12-31`;
  }
  const data = await rawgFetch('/games', params);
  return (data.results || []).map((g: any) => ({
    id: String(g.id),
    title: g.name,
    year: g.released ? parseInt(g.released.slice(0, 4)) : undefined,
    coverUrl: g.background_image,
  }));
}

async function getGame(id: string): Promise<{
  id: string;
  title: string;
  year?: number;
  coverUrl?: string;
  description?: string;
  videoUrl?: string;
  screenshots: string[];
  genres: string[];
  publishers: string[];
}> {
  const data = await rawgFetch(`/games/${id}`);
  return {
    id: String(data.id),
    title: data.name,
    year: data.released ? parseInt(data.released.slice(0, 4)) : undefined,
    coverUrl: data.background_image,
    description: data.description_raw,
    videoUrl: data.clip?.clip,
    screenshots: (data.short_screenshots || []).map((s: any) => s.image),
    genres: (data.genres || []).map((g: any) => g.name),
    publishers: (data.publishers || []).map((p: any) => p.name),
  };
}

// Export the functions directly
export { searchGame, getGame };
