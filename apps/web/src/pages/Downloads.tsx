import { useEffect } from 'react';
import { useApiQuery, useApiMutation } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface Download {
  id: string;
  hash?: string;
  name?: string;
  client: string;
  progress?: number;
  dlspeed?: number;
  eta?: number;
  state: string;
}

function formatSpeed(bytes: number) {
  if (!bytes) return '0 B/s';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
}

function formatEta(seconds: number) {
  if (seconds <= 0 || !Number.isFinite(seconds)) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

export function Downloads() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useApiQuery<Download[]>({
    queryKey: ['downloads'],
    path: '/downloads',
    refetchInterval: 3000,
  });

  useEffect(() => {
    try {
      const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
      const url = new URL(base);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.pathname = '/ws';
      const ws = new WebSocket(url.toString());
      ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload.type === 'downloads') {
            queryClient.setQueryData(['downloads'], payload.data);
          }
        } catch {
          // ignore
        }
      };
      return () => ws.close();
    } catch {
      // ignore errors and fall back to polling
    }
  }, [queryClient]);

  const pauseMut = useApiMutation<void, { id: string }>(
    (v) => ({
      path: `/downloads/${v.id}/pause`,
      init: { method: 'POST' },
    }),
    {
      onMutate: async (vars) => {
        await queryClient.cancelQueries({ queryKey: ['downloads'] });
        const prev = queryClient.getQueryData<Download[]>(['downloads']);
        queryClient.setQueryData<Download[]>(['downloads'], (old = []) =>
          old.map((d) => (d.id === vars.id ? { ...d, state: 'paused' } : d)),
        );
        return { prev };
      },
      onError: (_err, _vars, ctx) => {
        if (ctx?.prev) queryClient.setQueryData(['downloads'], ctx.prev);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['downloads'] });
      },
    },
  );

  const resumeMut = useApiMutation<void, { id: string }>(
    (v) => ({
      path: `/downloads/${v.id}/resume`,
      init: { method: 'POST' },
    }),
    {
      onMutate: async (vars) => {
        await queryClient.cancelQueries({ queryKey: ['downloads'] });
        const prev = queryClient.getQueryData<Download[]>(['downloads']);
        queryClient.setQueryData<Download[]>(['downloads'], (old = []) =>
          old.map((d) => (d.id === vars.id ? { ...d, state: 'downloading' } : d)),
        );
        return { prev };
      },
      onError: (_err, _vars, ctx) => {
        if (ctx?.prev) queryClient.setQueryData(['downloads'], ctx.prev);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['downloads'] });
      },
    },
  );

  const removeMut = useApiMutation<void, { id: string }>(
    (v) => ({
      path: `/downloads/${v.id}`,
      init: { method: 'DELETE' },
    }),
    {
      onMutate: async (vars) => {
        await queryClient.cancelQueries({ queryKey: ['downloads'] });
        const prev = queryClient.getQueryData<Download[]>(['downloads']);
        queryClient.setQueryData<Download[]>(['downloads'], (old = []) =>
          old.filter((d) => d.id !== vars.id),
        );
        return { prev };
      },
      onError: (_err, _vars, ctx) => {
        if (ctx?.prev) queryClient.setQueryData(['downloads'], ctx.prev);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['downloads'] });
      },
    },
  );

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Downloads</h1>
      {!isLoading && data && data.length === 0 && (
        <p className="text-gray-500">No downloads</p>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Client</th>
              <th className="p-2">Progress</th>
              <th className="p-2">Speed</th>
              <th className="p-2">ETA</th>
              <th className="p-2">State</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading &&
              data?.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-2">{d.name}</td>
                <td className="p-2">{d.client}</td>
                <td className="p-2 w-48">
                  <div className="w-full bg-gray-200 rounded h-2">
                    <div
                      className="bg-blue-500 h-2 rounded"
                      style={{ width: `${(d.progress || 0) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="p-2">{formatSpeed(d.dlspeed)}</td>
                <td className="p-2">{formatEta(d.eta)}</td>
                <td className="p-2">
                  {d.state}{' '}
                  {d.state === 'completed' && (
                    <a href="/activity" className="text-blue-600 ml-2">
                      Show in Imports
                    </a>
                  )}
                </td>
                <td className="p-2 space-x-2">
                  {d.state.startsWith('paused') ? (
                    <button
                      className="text-blue-600"
                      onClick={() => resumeMut.mutate({ id: d.id })}
                    >
                      Resume
                    </button>
                  ) : (
                    <button
                      className="text-blue-600"
                      onClick={() => pauseMut.mutate({ id: d.id })}
                    >
                      Pause
                    </button>
                  )}
                  <button
                    className="text-red-600"
                    onClick={() => removeMut.mutate({ id: d.id })}
                  >
                    Remove
                  </button>
                </td>
                </tr>
              ))}
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t animate-pulse">
                  <td className="p-2">
                    <div className="h-4 bg-gray-200 rounded w-48" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </td>
                  <td className="p-2 w-48">
                    <div className="w-full bg-gray-200 rounded h-2" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 bg-gray-200 rounded w-16" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 bg-gray-200 rounded w-16" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

