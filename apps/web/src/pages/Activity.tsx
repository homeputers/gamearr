import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export function Activity() {
  const { data } = useQuery({ queryKey: ['activity'], queryFn: api.getActivity });
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Activity</h1>
      <ul className="space-y-2">
        {data?.map((a: any) => (
          <li key={a.id} className="border p-2 rounded">
            {a.message || a.error}
          </li>
        ))}
      </ul>
    </div>
  );
}
