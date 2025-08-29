import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApiQuery, useApiMutation, apiFetch } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useCommand } from '../components/command-palette';

interface Artifact {
  id: string;
  path: string;
  size: number;
  crc32?: string | null;
  sha1?: string | null;
  addedAt?: string;
}

interface SearchResult {
  id: string;
  title: string;
  year?: number;
  coverUrl?: string;
  sources: string[];
}

export function Unmatched() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data } = useApiQuery<Artifact[]>({
    queryKey: ['unmatched', page],
    path: `/artifacts/unmatched?page=${page}&limit=${limit}`,
  });

  const [selected, setSelected] = useState<Artifact | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('');
  const [searchParams, setSearchParams] = useState<{ q: string; platform: string } | null>(null);
  const { setActions } = useCommand();

  useEffect(() => {
    if (selected) {
      const defaultQuery = selected.path.split('/').pop() || '';
      setQuery(defaultQuery);
      setPlatform('');
      setSearchParams({ q: defaultQuery, platform: '' });
    }
  }, [selected]);

  const searchQuery = useApiQuery<SearchResult[]>({
    queryKey: ['search', searchParams?.q, searchParams?.platform],
    path: `/metadata/search?q=${encodeURIComponent(searchParams?.q || '')}&platform=${encodeURIComponent(
      searchParams?.platform || '',
    )}`,
    enabled: !!selected && !!searchParams?.q,
  });

  const matchMutation = useApiMutation<void, { provider: string; providerId: string }>(
    ({ provider, providerId }) => ({
      path: `/artifacts/${selected!.id}/match`,
      init: {
        method: 'POST',
        body: JSON.stringify({ provider, providerId }),
      },
    }),
    {
      onSuccess: () => {
        toast('Match approved');
        setSelected(null);
        queryClient.invalidateQueries({ queryKey: ['unmatched'] });
      },
      onError: (err) => toast.error(err.message),
    },
  );

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
    setSelectedIds(checked ? new Set(data.map((a) => a.id)) : new Set());
  }

  async function bulk(path: string, ids: string[]) {
    await Promise.all(ids.map((id) => apiFetch(path.replace(':id', id), { method: 'POST' })));
  }

  const bulkMatch = async (ids: string[]) => {
    toast(`Match ${ids.length} items`);
  };
  const bulkRescan = async (ids: string[]) => {
    await bulk('/artifacts/:id/rescan', ids);
    toast(`Rescan requested for ${ids.length} items`);
  };
  const bulkReorg = async (ids: string[]) => {
    await bulk('/artifacts/:id/organize', ids);
    toast(`Re-organize requested for ${ids.length} items`);
  };
  const bulkExport = async (ids: string[]) => {
    await apiFetch('/exports', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
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
    <div className="flex">
      <div className="flex-1">
        {selectedIds.size > 0 && (
          <div className="flex gap-2 p-2">
            <Button onClick={() => bulkMatch(Array.from(selectedIds))}>Match with selection…</Button>
            <Button onClick={() => bulkRescan(Array.from(selectedIds))}>Rescan</Button>
            <Button onClick={() => bulkReorg(Array.from(selectedIds))}>Re-organize</Button>
            <Button onClick={() => bulkExport(Array.from(selectedIds))}>Export</Button>
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">
                <input
                  type="checkbox"
                  checked={data?.length ? selectedIds.size === data.length : false}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </th>
              <th className="p-2">Path</th>
              <th className="p-2">Size</th>
              <th className="p-2">Hashes</th>
              <th className="p-2">Added</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((a) => (
              <tr
                key={a.id}
                onClick={() => setSelected(a)}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <td className="p-2 border-b">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(a.id)}
                    onChange={(e) => toggle(a.id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="p-2 border-b break-all">{a.path}</td>
                <td className="p-2 border-b">{a.size}</td>
                <td className="p-2 border-b">
                  {[a.crc32, a.sha1].filter(Boolean).join(' / ')}
                </td>
                <td className="p-2 border-b">
                  {a.addedAt ? new Date(a.addedAt).toLocaleString() : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between p-2">
          <Button
            variant="ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span>Page {page}</span>
          <Button
            variant="ghost"
            onClick={() => setPage((p) => p + 1)}
            disabled={!data || data.length < limit}
          >
            Next
          </Button>
        </div>
      </div>

      {selected && (
        <div className="w-80 border-l p-4 space-y-4">
          <h2 className="font-bold break-all">{selected.path}</h2>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSearchParams({ q: query, platform });
            }}
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title"
              className="flex-1"
            />
            <Input
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="Platform"
              className="w-24"
            />
            <Button type="submit">Search</Button>
          </form>

          <div className="grid gap-2">
            {searchQuery.data?.map((r) => (
              <div key={r.id} className="border rounded overflow-hidden">
                {r.coverUrl && (
                  <img
                    src={r.coverUrl}
                    alt={r.title}
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="p-2 space-y-1">
                  <div className="font-medium leading-tight">{r.title}</div>
                  <div className="text-xs text-gray-500">
                    {[r.year, r.sources.join(', ')].filter(Boolean).join(' • ')}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() =>
                      matchMutation.mutate({ provider: r.sources[0], providerId: r.id })
                    }
                  >
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
