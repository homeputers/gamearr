import { readSettings } from '@gamearr/shared';

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const BASE_URL = 'https://api.igdb.com/v4';

// Platform mapping from RAWG ids or slugs to IGDB platform ids
const PLATFORM_MAP: Record<string, number> = {
  // Common mappings - both numeric RAWG ids and slugs
  '4': 6, // RAWG PC -> IGDB PC (Windows)
  pc: 6,
  '187': 130, // RAWG Switch -> IGDB Switch
  switch: 130,
  '18': 48, // RAWG PS4 -> IGDB PS4
  ps4: 48,
  '1879': 167, // PS5
  ps5: 167,
  '1': 24, // Rawg Xbox One? approximated mapping
  xboxone: 49,
  xbox: 11,
  '7': 7, // PlayStation
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  const { providers } = await readSettings();
  const clientId = providers.igdbClientId;
  const clientSecret = providers.igdbClientSecret;
  if (!clientId || !clientSecret) {
    return null;
  }
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }
  const url = `${TOKEN_URL}?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`IGDB auth failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    // subtract 60 seconds to be safe
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

async function igdbFetch(path: string, body: string): Promise<any> {
  const token = await getToken();
  if (!token) {
    return null;
  }
  const { providers } = await readSettings();
  const clientId = providers.igdbClientId;
  if (!clientId) {
    return null;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
    },
    body,
  });
  if (res.status === 401) {
    // Token expired; reset and retry once
    cachedToken = null;
    return igdbFetch(path, body);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`IGDB request failed: ${res.status} ${text}`);
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
  const token = await getToken();
  if (!token) {
    return [];
  }
  const platformId = PLATFORM_MAP[platform];
  const filters: string[] = [];
  if (platformId) {
    filters.push(`platforms = (${platformId})`);
  }
  if (year) {
    const start = Math.floor(Date.UTC(year, 0, 1) / 1000);
    const end = Math.floor(Date.UTC(year, 11, 31) / 1000);
    filters.push(`first_release_date >= ${start} & first_release_date <= ${end}`);
  }
  const whereClause = filters.length ? `where ${filters.join(' & ')};` : '';
  const body = `search "${title}"; ${whereClause} fields id,name,first_release_date,cover.image_id; limit 10;`;
  const data = await igdbFetch('/games', body);
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((g: any) => ({
    id: String(g.id),
    title: g.name,
    year: g.first_release_date
      ? new Date(g.first_release_date * 1000).getFullYear()
      : undefined,
    coverUrl: g.cover?.image_id
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`
      : undefined,
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
  const token = await getToken();
  if (!token) {
    throw new Error('IGDB credentials not configured');
  }
  const body = `fields id,name,first_release_date,summary,cover.image_id,videos.video_id,screenshots.image_id,genres.name,involved_companies.company.name,involved_companies.publisher; where id = ${id}; limit 1;`;
  const data = await igdbFetch('/games', body);
  const g = Array.isArray(data) ? data[0] : null;
  if (!g) {
    throw new Error('Game not found');
  }
  return {
    id: String(g.id),
    title: g.name,
    year: g.first_release_date
      ? new Date(g.first_release_date * 1000).getFullYear()
      : undefined,
    coverUrl: g.cover?.image_id
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`
      : undefined,
    description: g.summary,
    videoUrl: g.videos?.[0]?.video_id
      ? `https://www.youtube.com/watch?v=${g.videos[0].video_id}`
      : undefined,
    screenshots: (g.screenshots || []).map(
      (s: any) =>
        `https://images.igdb.com/igdb/image/upload/t_screenshot_huge/${s.image_id}.jpg`
    ),
    genres: (g.genres || []).map((ge: any) => ge.name),
    publishers: (g.involved_companies || [])
      .filter((c: any) => c.publisher)
      .map((c: any) => c.company?.name)
      .filter(Boolean),
  };
}

export { searchGame, getGame, PLATFORM_MAP };

