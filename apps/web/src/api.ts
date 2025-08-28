const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

async function post<T>(path: string, body: any): Promise<T> {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

export const api = {
  listLibraries: () => get('/libraries'),
  addLibrary: (data: { path: string; platformId: string }) =>
    post('/libraries', data),
  scanLibrary: (id: string) => post(`/libraries/${id}/scan`, {}),
  getUnmatched: () => get('/artifacts/unmatched'),
  searchMetadata: (q: string, platform: string, year?: string) =>
    get(
      `/metadata/search?q=${encodeURIComponent(q)}&platform=${encodeURIComponent(platform)}${
        year ? `&year=${year}` : ''
      }`,
    ),
  matchArtifact: (id: string, provider: string, providerId: string) =>
    post(`/artifacts/${id}/match`, { provider, providerId }),
  getGames: () => get('/games'),
  getActivity: () => get('/imports/activity'),
  getDownloads: () => get('/downloads'),
  addMagnet: (magnet: string) => post('/downloads/magnet', { magnet }),
  health: () => get('/health'),
};
