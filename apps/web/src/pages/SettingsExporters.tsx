import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApiQuery, useApiMutation } from '../lib/api';
import { Button } from '../components/ui/button';

interface Exporter {
  id: string;
  name: string;
  targetPath: string;
  lastExportedAt: string | null;
  itemCount: number;
}

export function SettingsExporters() {
  const queryClient = useQueryClient();
  const { data } = useApiQuery<Exporter[]>({ queryKey: ['exports'], path: '/exports' });
  const mutation = useApiMutation<{ status: string }, { id: string }>(
    ({ id }) => ({ path: `/exports/${id}`, init: { method: 'POST', body: JSON.stringify({}) } }),
    {
      onSuccess: () => {
        toast('Export completed');
        queryClient.invalidateQueries({ queryKey: ['exports'] });
      },
      onError: (err) => toast.error(err.message),
    },
  );

  const exportingId = mutation.variables?.id;

  return (
    <div className="p-4 space-y-4">
      {data?.map((exp) => {
        const isLoading = mutation.isPending && exportingId === exp.id;
        return (
          <div key={exp.id} className="border rounded p-4 space-y-2">
            <h2 className="text-lg font-medium">{exp.name}</h2>
            <div>Target: {exp.targetPath}</div>
            <div>
              Last export:{' '}
              {exp.lastExportedAt ? new Date(exp.lastExportedAt).toLocaleString() : 'Never'}
            </div>
            <div>Items: {exp.itemCount}</div>
            <Button onClick={() => mutation.mutate({ id: exp.id })} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...
                </>
              ) : (
                'Run Export'
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

