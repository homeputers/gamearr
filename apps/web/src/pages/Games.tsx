import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { Input } from '../components/ui/input';

export function Games() {
  const [platform, setPlatform] = useState('');
  const [region, setRegion] = useState('');
  const { data } = useQuery({
    queryKey: ['games', platform, region],
    queryFn: api.getGames,
  });

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Games</h1>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        />
        <Input
          placeholder="Region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {data?.map((g: any) => (
          <div key={g.id} className="border p-2 rounded">
            {g.title}
          </div>
        ))}
      </div>
    </div>
  );
}
