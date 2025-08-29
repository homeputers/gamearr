import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useApiQuery, useApiMutation } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface Library {
  id: string;
  platformId: string;
  path: string;
  lastScannedAt?: string | null;
}

const schema = z.object({
  platformId: z.string().min(1, 'Platform is required'),
  rootPath: z.string().min(1, 'Path is required'),
});

type FormValues = z.infer<typeof schema>;

export function Libraries() {
  const queryClient = useQueryClient();
  const { data } = useApiQuery<Library[]>({
    queryKey: ['libraries'],
    path: '/libraries',
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Library | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { platformId: '', rootPath: '' },
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        form.reset({ platformId: editing.platformId, rootPath: editing.path });
      } else {
        form.reset({ platformId: '', rootPath: '' });
      }
    }
  }, [open, editing, form]);

  const createMutation = useApiMutation<Library, FormValues>(
    (values) => ({
      path: '/libraries',
      init: {
        method: 'POST',
        body: JSON.stringify({ platformId: values.platformId, path: values.rootPath }),
      },
    }),
    {
      onMutate: async (values) => {
        await queryClient.cancelQueries({ queryKey: ['libraries'] });
        const previous = queryClient.getQueryData<Library[]>(['libraries']);
        const optimistic: Library = {
          id: `temp-${Math.random()}`,
          platformId: values.platformId,
          path: values.rootPath,
          lastScannedAt: null,
        };
        queryClient.setQueryData<Library[]>(['libraries'], (old) =>
          old ? [...old, optimistic] : [optimistic],
        );
        return { previous };
      },
      onError: (_err, _vars, ctx) => {
        queryClient.setQueryData(['libraries'], ctx?.previous);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['libraries'] });
      },
      onSuccess: () => {
        setOpen(false);
      },
    },
  );

  const updateMutation = useApiMutation<Library, { id: string; values: FormValues }>(
    ({ id, values }) => ({
      path: `/libraries/${id}`,
      init: {
        method: 'PUT',
        body: JSON.stringify({ platformId: values.platformId, path: values.rootPath }),
      },
    }),
    {
      onSuccess: () => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ['libraries'] });
      },
    },
  );

  const deleteMutation = useApiMutation<void, string>(
    (id) => ({ path: `/libraries/${id}`, init: { method: 'DELETE' } }),
    {
      onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: ['libraries'] });
        const previous = queryClient.getQueryData<Library[]>(['libraries']);
        queryClient.setQueryData<Library[]>(['libraries'], (old) =>
          old?.filter((l) => l.id !== id) ?? [],
        );
        return { previous };
      },
      onError: (_err, _vars, ctx) => {
        queryClient.setQueryData(['libraries'], ctx?.previous);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['libraries'] });
      },
    },
  );

  const scanMutation = useApiMutation<void, string>(
    (id) => ({
      path: `/libraries/${id}/scan`,
      init: { method: 'POST', body: JSON.stringify({}) },
    }),
    {
      onSuccess: () => {
        toast('Scan started');
        queryClient.invalidateQueries({ queryKey: ['libraries'] });
      },
    },
  );

  const onSubmit = (values: FormValues) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleEdit = (lib: Library) => {
    setEditing(lib);
    setOpen(true);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">Libraries</h1>
        <Button onClick={handleAdd}>Add Library</Button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="px-2 py-1">Platform</th>
            <th className="px-2 py-1">Path</th>
            <th className="px-2 py-1">Last Scanned</th>
            <th className="px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((lib) => (
            <tr key={lib.id} className="border-b">
              <td className="px-2 py-1">{lib.platformId}</td>
              <td className="px-2 py-1 break-all">{lib.path}</td>
              <td className="px-2 py-1">
                {lib.lastScannedAt ? new Date(lib.lastScannedAt).toLocaleString() : '-'}
              </td>
              <td className="px-2 py-1 space-x-2">
                <Button className="h-8 px-2" onClick={() => scanMutation.mutate(lib.id)}>
                  Scan
                </Button>
                <Button
                  className="h-8 px-2"
                  variant="ghost"
                  onClick={() => handleEdit(lib)}
                >
                  Edit
                </Button>
                <Button
                  className="h-8 px-2"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(lib.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-80 space-y-4 rounded bg-white p-4 dark:bg-gray-900">
            <h2 className="text-lg">
              {editing ? 'Edit Library' : 'Add Library'}
            </h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">Platform ID</label>
                <Input {...form.register('platformId')} />
                {form.formState.errors.platformId && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.platformId.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm">Root Path</label>
                <Input {...form.register('rootPath')} />
                {form.formState.errors.rootPath && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.rootPath.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editing ? 'Save' : 'Add'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

