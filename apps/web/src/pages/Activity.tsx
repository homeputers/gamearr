import { useApiQuery } from '../lib/api';

export function Activity() {
  const { data } = useApiQuery<any[]>({ queryKey: ['activity'], path: '/imports/activity' });
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
