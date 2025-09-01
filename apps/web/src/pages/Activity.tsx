import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../lib/api';

interface ActivityEntry {
  id: string;
  type: 'scan' | 'hash' | 'match' | 'import' | 'export' | 'error';
  timestamp: string;
  message?: string;
  details?: Record<string, any>;
  retry?: { path: string; method?: string };
}

const steps: ActivityEntry['type'][] = ['scan', 'hash', 'match', 'import'];

export function Activity() {
  const { data, refetch } = useApiQuery<ActivityEntry[]>({
    queryKey: ['activity'],
    path: '/imports/activity',
  });

  const retryMut = useApiMutation<void, { path: string; method?: string }>(
    (v) => ({ path: v.path, init: { method: v.method ?? 'POST' } }),
    { onSuccess: () => refetch() },
  );

  const grouped = useMemo(() => {
    const result: Record<string, ActivityEntry[]> = {};
    (data || []).forEach((e) => {
      const key = String(e.details?.file || e.message || e.id);
      (result[key] ||= []).push(e);
    });
    return result;
  }, [data]);

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Activity</h1>
      {data && data.length === 0 && (
        <p className="text-gray-500">No activity yet</p>
      )}
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2">File</th>
            {steps.map((s) => (
              <th key={s} className="p-2 capitalize">
                {s}
              </th>
            ))}
            <th className="p-2">Error</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([file, items]) => {
            const types = new Set(items.map((i) => i.type));
            const hash = items.find((i) => i.type === 'hash')?.details as any;
            const match = items.find((i) => i.type === 'match')?.details as any;
            const imp = items.find((i) => i.type === 'import')?.details as any;
            const err = items.find((i) => i.type === 'error');
            return (
              <tr key={file} className="border-t">
                <td className="p-2 align-top">
                  <details>
                    <summary
                      className={`cursor-pointer ${err ? 'text-red-600' : ''}`}
                    >
                      {file.split('/').pop()}
                    </summary>
                    <div className="mt-2 space-y-1 text-xs">
                      <div>Artifact: {imp?.source || file}</div>
                      {hash && (
                        <div>
                          Hashes: {hash.sha1 && `SHA1 ${hash.sha1} `}
                          {hash.crc32 && `CRC32 ${hash.crc32}`}
                        </div>
                      )}
                      {imp?.target && <div>Target: {imp.target}</div>}
                      {match && (
                        <div>
                          DAT: {match.dat || 'none'}
                          {typeof match.confidence !== 'undefined' &&
                            ` (${match.confidence})`}
                        </div>
                      )}
                      {imp?.template && <div>Template: {imp.template}</div>}
                      {err?.retry && (
                        <button
                          className="text-blue-600"
                          onClick={() =>
                            retryMut.mutate({
                              path: err.retry!.path,
                              method: err.retry!.method,
                            })
                          }
                        >
                          Retry import
                        </button>
                      )}
                    </div>
                  </details>
                </td>
                {steps.map((s) => (
                  <td key={s} className="p-2 text-center">
                    {types.has(s) ? '✓' : ''}
                  </td>
                ))}
                <td className="p-2 text-red-600">{err?.message || ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

