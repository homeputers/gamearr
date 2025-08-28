import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { Button } from '../components/ui/button';

export function Unmatched() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['unmatched'], queryFn: api.getUnmatched });
  const [selected, setSelected] = useState<any | null>(null);
  const searchQuery = useQuery({
    queryKey: ['search', selected?.id],
    queryFn: () =>
      api.searchMetadata(selected?.path.split('/').pop() || '', ''),
    enabled: !!selected,
  });

  const matchMutation = useMutation({
    mutationFn: (providerId: string) =>
      api.matchArtifact(selected!.id, 'rawg', providerId),
    onSuccess: () => {
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ['unmatched'] });
    },
  });

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
