import { useState } from 'react';
import { useApiQuery, useApiMutation } from '../lib/api';
import { Button } from '../components/ui/button';

interface ArtifactInfo {
  id: string;
  preferred: boolean;
  region?: string;
  revision?: number;
  verified?: boolean;
}

interface DuplicateGame {
  id: string;
  title: string;
  artifacts: ArtifactInfo[];
}

export function GamesDuplicates() {
  const { data, refetch } = useApiQuery<DuplicateGame[]>({
    queryKey: ['game-duplicates'],
    path: '/games/duplicates',
  });
  const [overrides, setOverrides] = useState<Record<string, string | undefined>>({});

  const mutation = useApiMutation<{ changes: { artifactId: string; preferred: boolean }[] }, { dryRun: boolean; overrides: Record<string, string> }>(
    ({ dryRun, overrides }) => ({
      path: '/games/duplicates/apply',
      init: {
        method: 'POST',
        body: JSON.stringify({ dryRun, overrides }),
      },
    }),
  );

  function artifactLabel(a: ArtifactInfo) {
    const parts = [] as string[];
    if (a.region) parts.push(a.region);
    if (a.revision != null) parts.push(`rev ${a.revision}`);
    if (a.verified) parts.push('verified');
    return parts.join(' ');
  }

  async function apply() {
    const preview = await mutation.mutateAsync({ dryRun: true, overrides });
    const summary = preview.changes
      .map((c) => `${c.artifactId}: ${c.preferred ? 'preferred' : 'not preferred'}`)
      .join('\n');
    const ok = window.confirm(`Apply the following changes?\n${summary}`);
    if (!ok) return;
    await mutation.mutateAsync({ dryRun: false, overrides });
    setOverrides({});
    refetch();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl">Duplicate Games</h1>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2">Game</th>
            <th className="text-left p-2">Preferred</th>
            <th className="text-left p-2">Candidates</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((g) => {
            const prefId =
              overrides[g.id] || g.artifacts.find((a) => a.preferred)?.id || g.artifacts[0]?.id || '';
            return (
              <tr key={g.id} className="border-t">
                <td className="p-2">{g.title}</td>
                <td className="p-2">{artifactLabel(g.artifacts.find((a) => a.id === prefId)!)}</td>
                <td className="p-2">
                  {g.artifacts.map((a) => (
                    <span key={a.id} className="mr-2">
                      {artifactLabel(a)}
                    </span>
                  ))}
                </td>
                <td className="p-2">
                  <select
                    value={overrides[g.id] || ''}
                    onChange={(e) =>
                      setOverrides((o) => ({ ...o, [g.id]: e.target.value || undefined }))
                    }
                  >
                    <option value="">Auto</option>
                    {g.artifacts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {artifactLabel(a)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {data && data.length > 0 && (
        <Button onClick={apply}>Apply 1G1R</Button>
      )}
    </div>
  );
}
