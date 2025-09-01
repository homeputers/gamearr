import { Link } from 'react-router-dom';
import { useApiQuery } from '../lib/api';

interface Platform {
  id: string;
  name: string;
  aliases: string[];
  activeDatFile?: {
    version?: string;
    activatedAt?: string | null;
  } | null;
  counts?: Record<string, number>;
}

export function SettingsPlatforms() {
  const { data } = useApiQuery<Platform[]>({
    queryKey: ['platforms'],
    path: '/platforms',
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-medium">Platforms</h1>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Aliases</th>
            <th className="text-left p-2">Active DAT</th>
            <th className="text-left p-2">Activated</th>
            <th className="text-left p-2">DAT Status</th>
            <th className="text-left p-2">Counts</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {data?.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.aliases?.join(', ')}</td>
              <td className="p-2">{p.activeDatFile?.version || '-'}</td>
              <td className="p-2">
                {p.activeDatFile?.activatedAt
                  ? new Date(p.activeDatFile.activatedAt).toLocaleDateString()
                  : '-'}
              </td>
              <td className="p-2">
                {p.activeDatFile?.activatedAt ? (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                    DAT matching active
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                    DAT matching inactive
                  </span>
                )}
              </td>
              <td className="p-2">
                {p.counts
                  ? Object.entries(p.counts)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(', ')
                  : '-'}
              </td>
              <td className="p-2">
                <Link
                  to={`/settings/platforms/${p.id}`}
                  className="text-blue-500 underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SettingsPlatforms;
