import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export function Libraries() {
  const queryClient = useQueryClient();
  const { data } = useApiQuery<any[]>({ queryKey: ['libraries'], path: '/libraries' });
  const [path, setPath] = useState('');
  const [platformId, setPlatformId] = useState('');

  const addMutation = useApiMutation<any, { path: string; platformId: string }>(
    (body) => ({
      path: '/libraries',
      init: { method: 'POST', body: JSON.stringify(body) },
    }),
    {
      onSuccess: () => {
        setPath('');
        setPlatformId('');
        queryClient.invalidateQueries({ queryKey: ['libraries'] });
      },
    },
  );

  const scanMutation = useApiMutation<any, string>((id) => ({
    path: `/libraries/${id}/scan`,
    init: { method: 'POST', body: JSON.stringify({}) },
  }));

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Libraries</h1>
      <ul className="mb-4 space-y-2">
        {data?.map((lib: any) => (
          <li key={lib.id} className="flex items-center gap-2">
            <span className="flex-1">{lib.path}</span>
            <Button onClick={() => scanMutation.mutate(lib.id)}>Scan</Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input
          placeholder="Path"
          value={path}
          onChange={(e) => setPath(e.target.value)}
        />
        <Input
          placeholder="Platform"
          value={platformId}
          onChange={(e) => setPlatformId(e.target.value)}
        />
        <Button onClick={() => addMutation.mutate()} disabled={!path || !platformId}>
          Add
        </Button>
      </div>
    </div>
  );
}
