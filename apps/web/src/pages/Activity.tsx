import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../lib/api';

interface ActivityEntry {
  id: string;
  type: 'scan' | 'hash' | 'match' | 'import' | 'export' | 'error';
  timestamp: string;
  message?: string;
  details?: Record<string, unknown>;
  retry?: { path: string; method?: string };
}

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
      const date = e.timestamp.split('T')[0];
      (result[date] ||= []).push(e);
    });
    return result;
  }, [data]);

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Activity</h1>
      {data && data.length === 0 && (
        <p className="text-gray-500">No activity yet</p>
      )}
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="mb-6">
          <h2 className="font-semibold mb-2">{date}</h2>
          <table className="min-w-full text-sm">
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-2 align-top">
                    <details>
                      <summary
                        className={`cursor-pointer ${
                          a.type === 'error' ? 'text-red-600' : ''
                        }`}
                      >
                        [{a.type}] {a.message || a.details?.file}
                      </summary>
                      <div className="mt-2 space-y-2">
                        {a.details && (
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(a.details, null, 2)}
                          </pre>
                        )}
                        {a.retry && (
                          <button
                            className="text-blue-600"
                            onClick={() =>
                              retryMut.mutate({
                                path: a.retry!.path,
                                method: a.retry!.method,
                              })
                            }
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
