import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '../lib/api';
import { Button } from '../components/ui/button';

export function Unmatched() {
  const queryClient = useQueryClient();
  const { data } = useApiQuery<any[]>({
    queryKey: ['unmatched'],
    path: '/artifacts/unmatched',
  });
  const [selected, setSelected] = useState<any | null>(null);
  const searchQuery = useApiQuery<any[]>({
    queryKey: ['search', selected?.id],
    path: `/metadata/search?q=${encodeURIComponent(
      selected?.path.split('/').pop() || '',
    )}&platform=`,
    enabled: !!selected,
  });

  const matchMutation = useApiMutation<void, string>(
    (providerId) => ({
      path: `/artifacts/${selected!.id}/match`,
      init: {
        method: 'POST',
        body: JSON.stringify({ provider: 'rawg', providerId }),
      },
    }),
    {
      onSuccess: () => {
        setSelected(null);
        queryClient.invalidateQueries({ queryKey: ['unmatched'] });
      },
    },
  );

  return (
    <div className="flex">
      <table className="flex-1">
        <tbody>
          {data?.map((a: any) => (
            <tr
              key={a.id}
              onClick={() => setSelected(a)}
              className="cursor-pointer"
            >
              <td className="p-2 border-b">{a.path}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {selected && (
        <div className="w-80 border-l p-4 space-y-2">
          <h2 className="font-bold break-all">{selected.path}</h2>
          <ul className="space-y-2">
            {searchQuery.data?.map((r: any) => (
              <li key={r.id} className="flex items-center gap-2">
                <span className="flex-1">{r.title}</span>
                <Button onClick={() => matchMutation.mutate(r.id)}>Approve</Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
