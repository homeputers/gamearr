import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export function Libraries() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['libraries'], queryFn: api.listLibraries });
  const [path, setPath] = useState('');
  const [platformId, setPlatformId] = useState('');

  const addMutation = useMutation({
    mutationFn: () => api.addLibrary({ path, platformId }),
    onSuccess: () => {
      setPath('');
      setPlatformId('');
      queryClient.invalidateQueries({ queryKey: ['libraries'] });
    },
  });

  const scanMutation = useMutation({
    mutationFn: (id: string) => api.scanLibrary(id),
  });

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
