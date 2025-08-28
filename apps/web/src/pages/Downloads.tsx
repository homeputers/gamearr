import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export function Downloads() {
  const { data } = useQuery({ queryKey: ['downloads'], queryFn: api.getDownloads });
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Downloads</h1>
      <ul className="space-y-2">
        {data?.map((d: any) => (
          <li key={d.id || d.hash} className="border p-2 rounded">
            {d.name} {d.progress ? `(${d.progress}%)` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
