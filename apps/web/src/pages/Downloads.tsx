import { useEffect } from 'react';
import { useApiQuery, useApiMutation } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface Download {
  hash: string;
  name: string;
  client: string;
  progress: number;
  dlspeed: number;
  eta: number;
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
  const { data } = useApiQuery<Download[]>({
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

  const pauseMut = useApiMutation<void, { hash: string }>((v) => ({
    path: `/downloads/${v.hash}/pause`,
    init: { method: 'POST' },
  }), {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['downloads'] }),
  });

  const resumeMut = useApiMutation<void, { hash: string }>((v) => ({
    path: `/downloads/${v.hash}/resume`,
    init: { method: 'POST' },
  }), {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['downloads'] }),
  });

  const removeMut = useApiMutation<void, { hash: string }>((v) => ({
    path: `/downloads/${v.hash}`,
    init: { method: 'DELETE' },
  }), {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['downloads'] }),
  });

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Downloads</h1>
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
            {data?.map((d) => (
              <tr key={d.hash} className="border-t">
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
                      onClick={() => resumeMut.mutate({ hash: d.hash })}
                    >
                      Resume
                    </button>
                  ) : (
                    <button
                      className="text-blue-600"
                      onClick={() => pauseMut.mutate({ hash: d.hash })}
                    >
                      Pause
                    </button>
                  )}
                  <button
                    className="text-red-600"
                    onClick={() => removeMut.mutate({ hash: d.hash })}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

