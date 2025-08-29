import { useState, useEffect, useMemo } from 'react';
import { useApiQuery, apiFetch } from '../lib/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useCommand } from '../components/command-palette';

interface Game {
  id: string;
  title: string;
  platform: string;
  year?: number;
  coverUrl?: string;
  region?: string;
  language?: string;
  languages?: string[];
}

interface Filters {
  search: string;
  platforms: string[];
  regionsText: string;
  yearStart: string;
  yearEnd: string;
}

interface SavedView {
  name: string;
  filters: Filters;
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function Games() {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    platforms: [],
    regionsText: '',
    yearStart: '',
    yearEnd: '',
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { setActions } = useCommand();

  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const regionArray = useMemo(
    () => filters.regionsText.split(',').map((r) => r.trim()).filter(Boolean),
    [filters.regionsText],
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.platforms.length) params.set('platform', filters.platforms.join(','));
    if (regionArray.length) params.set('regions', regionArray.join(','));
    if (filters.yearStart) params.set('yearStart', filters.yearStart);
    if (filters.yearEnd) params.set('yearEnd', filters.yearEnd);
    if (debouncedSearch) params.set('q', debouncedSearch);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [filters.platforms, regionArray, filters.yearStart, filters.yearEnd, debouncedSearch]);

  const { data } = useApiQuery<Game[]>({
    queryKey: ['games', filters.platforms, regionArray, filters.yearStart, filters.yearEnd, debouncedSearch],
    path: `/games${queryString}`,
  });

  const platformsQuery = useApiQuery<{ id: string; name: string }[]>({
    queryKey: ['platforms'],
    path: '/platforms',
  });

  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    try {
      const raw = localStorage.getItem('gameViews');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem('gameViews', JSON.stringify(savedViews));
  }, [savedViews]);

  const [viewName, setViewName] = useState('');

  function saveView() {
    if (!viewName) return;
    setSavedViews((views) => {
      const idx = views.findIndex((v) => v.name === viewName);
      const newView = { name: viewName, filters };
      if (idx >= 0) {
        const copy = [...views];
        copy[idx] = newView;
        return copy;
      }
      return [...views, newView];
    });
  }

  function applyView(view: SavedView) {
    setFilters(view.filters);
    setViewName(view.name);
  }

  function deleteView(name: string) {
    setSavedViews((views) => views.filter((v) => v.name !== name));
  }

  function toggle(id: string, checked: boolean) {
    setSelectedIds((s) => {
      const copy = new Set(s);
      if (checked) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }

  function toggleAll(checked: boolean) {
    if (!data) return;
    setSelectedIds(checked ? new Set(data.map((g) => g.id)) : new Set());
  }

  async function bulk(path: string, ids: string[]) {
    await Promise.all(ids.map((id) => apiFetch(path.replace(':id', id), { method: 'POST' }))); 
  }

  const bulkMatch = async (ids: string[]) => {
    toast(`Match ${ids.length} items`);
  };
  const bulkRescan = async (ids: string[]) => {
    await bulk('/games/:id/rescan', ids);
    toast(`Rescan requested for ${ids.length} items`);
  };
  const bulkReorg = async (ids: string[]) => {
    await bulk('/games/:id/organize', ids);
    toast(`Re-organize requested for ${ids.length} items`);
  };
  const bulkExport = async (ids: string[]) => {
    await apiFetch('/exports', { method: 'POST', body: JSON.stringify({ ids }) });
    toast(`Export requested for ${ids.length} items`);
  };

  useEffect(() => {
    const ids = Array.from(selectedIds);
    if (ids.length) {
      setActions([
        { id: 'match', label: 'Match with selection…', action: () => bulkMatch(ids) },
        { id: 'rescan', label: 'Rescan', action: () => bulkRescan(ids) },
        { id: 'reorg', label: 'Re-organize', action: () => bulkReorg(ids) },
        { id: 'export', label: 'Export', action: () => bulkExport(ids) },
      ]);
    } else {
      setActions([]);
    }
    return () => setActions([]);
  }, [selectedIds, setActions]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl">Games</h1>

      <div className="space-y-2">
        <Input
          placeholder="Search"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="w-48"
        />

        <div className="flex flex-wrap gap-2">
          {platformsQuery.data?.map((p) => (
            <label key={p.id} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                value={p.id}
                checked={filters.platforms.includes(p.id)}
                onChange={(e) =>
                  setFilters((f) => {
                    const selected = e.target.checked
                      ? [...f.platforms, p.id]
                      : f.platforms.filter((id) => id !== p.id);
                    return { ...f, platforms: selected };
                  })
                }
              />
              {p.name}
            </label>
          ))}
        </div>

        <Input
          placeholder="Regions (comma separated)"
          value={filters.regionsText}
          onChange={(e) => setFilters((f) => ({ ...f, regionsText: e.target.value }))}
          className="w-64"
        />

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Year start"
            value={filters.yearStart}
            onChange={(e) => setFilters((f) => ({ ...f, yearStart: e.target.value }))}
            className="w-24"
          />
          <Input
            type="number"
            placeholder="Year end"
            value={filters.yearEnd}
            onChange={(e) => setFilters((f) => ({ ...f, yearEnd: e.target.value }))}
            className="w-24"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="View name"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            className="w-40"
          />
          <Button onClick={saveView}>Save View</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {savedViews.map((v) => (
            <div key={v.name} className="flex items-center gap-1">
              <Button variant="ghost" onClick={() => applyView(v)}>
                {v.name}
              </Button>
              <Button variant="ghost" onClick={() => deleteView(v.name)}>
                &times;
              </Button>
            </div>
          ))}
        </div>
      </div>

      {data && data.length === 0 && (
        <p className="text-gray-500">No games found</p>
      )}

      {data && data.length > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedIds.size === data.length}
            onChange={(e) => toggleAll(e.target.checked)}
          />
          <span className="text-sm">Select all</span>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="flex gap-2">
          <Button onClick={() => bulkMatch(Array.from(selectedIds))}>Match with selection…</Button>
          <Button onClick={() => bulkRescan(Array.from(selectedIds))}>Rescan</Button>
          <Button onClick={() => bulkReorg(Array.from(selectedIds))}>Re-organize</Button>
          <Button onClick={() => bulkExport(Array.from(selectedIds))}>Export</Button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {data?.map((g) => {
          const languages = g.languages || (g.language ? g.language.split(',') : []);
          return (
            <div key={g.id} className="relative border rounded overflow-hidden">
              <input
                type="checkbox"
                className="absolute top-2 left-2 z-10"
                checked={selectedIds.has(g.id)}
                onChange={(e) => toggle(g.id, e.target.checked)}
              />
              {g.coverUrl && (
                <img
                  src={g.coverUrl}
                  alt={g.title}
                  className="w-full aspect-[3/4] object-cover"
                />
              )}
              <div className="p-2 space-y-1">
                <div className="font-medium leading-tight">{g.title}</div>
                <div className="text-xs text-gray-500">
                  {[g.platform, g.year].filter(Boolean).join(' • ')}
                </div>
                <div className="flex flex-wrap gap-1">
                  {g.region && (
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 rounded px-1">
                      {g.region}
                    </span>
                  )}
                  {languages.map((l: string) => (
                    <span
                      key={l}
                      className="text-xs bg-gray-200 dark:bg-gray-700 rounded px-1"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

