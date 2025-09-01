import { useState } from 'react';
import { useApiQuery, useApiMutation } from '../lib/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

interface SearchResult {
  indexer: string;
  id: string;
  title: string;
  platform: string;
  size?: number;
  seeders?: number;
  link?: string;
}

function formatSize(bytes?: number) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

function ChipsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');

  function addChip() {
    const v = input.trim();
    if (v && !value.includes(v)) {
      onChange([...value, v]);
    }
    setInput('');
  }

  function removeChip(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border rounded px-2 py-1">
      {value.map((chip, idx) => (
        <span key={chip} className="flex items-center gap-1 bg-gray-200 rounded px-1 py-0.5 text-xs">
          {chip}
          <button
            type="button"
            className="text-gray-600 hover:text-gray-900"
            onClick={() => removeChip(idx)}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[80px] border-none bg-transparent focus:outline-none text-sm"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addChip();
          } else if (e.key === 'Backspace' && !input) {
            removeChip(value.length - 1);
          }
        }}
      />
    </div>
  );
}

export function Search() {
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('');
  const [year, setYear] = useState('');
  const [regions, setRegions] = useState<string[]>([]);
  const [query, setQuery] = useState<string | null>(null);

  const platformsQuery = useApiQuery<{ id: string; name: string }[]>({
    queryKey: ['platforms'],
    path: '/platforms',
  });

  const searchQuery = useApiQuery<SearchResult[]>({
    queryKey: ['search', query],
    path: query ? `/search${query}` : '',
    enabled: !!query,
  });

  const addMagnet = useApiMutation<void, { magnet: string }>((v) => ({
    path: '/downloads/magnet',
    init: { method: 'POST', body: JSON.stringify({ magnet: v.magnet }) },
  }), {
    onSuccess: () =>
      toast(
        <span>
          Added to downloads. <a href="/downloads" className="underline">View downloads</a>
        </span>,
      ),
    onError: (err) => toast.error(err.message),
  });

  const addFromSearch = useApiMutation<void, { indexer: string; id: string }>((v) => ({
    path: '/downloads/from-search',
    init: { method: 'POST', body: JSON.stringify(v) },
  }), {
    onSuccess: () =>
      toast(
        <span>
          Added to downloads. <a href="/downloads" className="underline">View downloads</a>
        </span>,
      ),
    onError: (err) => toast.error(err.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (title) params.set('title', title);
    if (platform) params.set('platform', platform);
    if (year) params.set('year', year);
    if (regions.length) params.set('regionPref', regions.join(','));
    const qs = params.toString();
    setQuery(qs ? `?${qs}` : '?');
  }

  const results = searchQuery.data ?? [];

  return (
    <div>
      <h1 className="text-xl mb-4">Search</h1>
      <form onSubmit={submit} className="space-y-2 mb-4">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Platform</label>
          <select
            className="w-full border rounded p-1"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="">Any</option>
            {platformsQuery.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Year</label>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Region Preference</label>
          <ChipsInput value={regions} onChange={setRegions} />
        </div>
        <Button type="submit">Search</Button>
      </form>
      {searchQuery.isFetching && <p>Searching...</p>}
      {query && !searchQuery.isFetching && results.length === 0 && (
        <p className="text-gray-500">No results</p>
      )}
      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Indexer</th>
                <th className="p-2">Title</th>
                <th className="p-2">Platform</th>
                <th className="p-2">Size</th>
                <th className="p-2">Seeders</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={`${r.indexer}:${r.id}`} className="border-t">
                  <td className="p-2">{r.indexer}</td>
                  <td className="p-2">{r.title}</td>
                  <td className="p-2">{r.platform}</td>
                  <td className="p-2">{formatSize(r.size)}</td>
                  <td className="p-2">{r.seeders ?? '—'}</td>
                  <td className="p-2">
                    <button
                      className="text-blue-600"
                      onClick={() => {
                        if (r.link && r.link.startsWith('magnet:')) {
                          addMagnet.mutate({ magnet: r.link });
                        } else {
                          addFromSearch.mutate({ indexer: r.indexer, id: r.id });
                        }
                      }}
                    >
                      Add
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Search;

