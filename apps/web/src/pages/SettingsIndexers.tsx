import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApiQuery, useApiMutation, ApiError } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface IndexerConfig {
  key: string;
  kind: 'torznab' | 'rss';
  name: string;
  config: any;
  isEnabled: boolean;
}

export function SettingsIndexers() {
  const queryClient = useQueryClient();
  const { data } = useApiQuery<IndexerConfig[]>({
    queryKey: ['indexers'],
    path: '/indexers',
  });

  const createMutation = useApiMutation<IndexerConfig, IndexerConfig>(
    (body) => ({
      path: '/indexers',
      init: { method: 'POST', body: JSON.stringify(body) },
    }),
    {
      onSuccess: () => {
        toast('Indexer saved');
        queryClient.invalidateQueries({ queryKey: ['indexers'] });
        setModalOpen(false);
      },
      onError: (err) => toast.error(err.message),
    },
  );

  const updateMutation = useApiMutation<IndexerConfig, { key: string; name: string; config: any }>(
    ({ key, ...body }) => ({
      path: `/indexers/${key}`,
      init: { method: 'PATCH', body: JSON.stringify(body) },
    }),
    {
      onSuccess: () => {
        toast('Indexer updated');
        queryClient.invalidateQueries({ queryKey: ['indexers'] });
        setModalOpen(false);
      },
      onError: (err) => toast.error(err.message),
    },
  );

  const deleteMutation = useApiMutation<{ status: string }, { key: string }>(
    ({ key }) => ({ path: `/indexers/${key}`, init: { method: 'DELETE' } }),
    {
      onSuccess: () => {
        toast('Indexer deleted');
        queryClient.invalidateQueries({ queryKey: ['indexers'] });
      },
      onError: (err) => toast.error(err.message),
    },
  );

  const toggleMutation = useApiMutation<IndexerConfig, { key: string; isEnabled: boolean }>(
    ({ key, isEnabled }) => ({
      path: `/indexers/${key}`,
      init: { method: 'PATCH', body: JSON.stringify({ isEnabled }) },
    }),
    {
      onSuccess: () => {
        toast('Indexer updated');
        queryClient.invalidateQueries({ queryKey: ['indexers'] });
      },
      onError: (err) => toast.error(err.message),
    },
  );

  const testMutation = useApiMutation<{ ok: boolean; error?: string }, { key: string }>(
    ({ key }) => ({ path: `/indexers/${key}/test`, init: { method: 'POST' } }),
  );

  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IndexerConfig | null>(null);

  const handleTest = (key: string) => {
    setTestResults((prev) => ({ ...prev, [key]: 'Testing...' }));
    testMutation.mutate(
      { key },
      {
        onSuccess: (res) => {
          setTestResults((prev) => ({
            ...prev,
            [key]: res.ok ? 'OK' : `Failed: ${res.error}`,
          }));
        },
        onError: (err: ApiError) => {
          setTestResults((prev) => ({ ...prev, [key]: `Error: ${err.message}` }));
        },
      },
    );
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (ix: IndexerConfig) => {
    setEditing(ix);
    setModalOpen(true);
  };

  const handleSave = (values: {
    key: string;
    kind: 'torznab' | 'rss';
    name: string;
    config: any;
  }) => {
    if (editing) {
      updateMutation.mutate({ key: editing.key, name: values.name, config: values.config });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd}>Add Indexer</Button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Kind</th>
            <th className="text-left p-2">Enabled</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((ix) => (
            <tr key={ix.key} className="border-t">
              <td className="p-2">{ix.name}</td>
              <td className="p-2">{ix.kind}</td>
              <td className="p-2">{ix.isEnabled ? 'Yes' : 'No'}</td>
              <td className="p-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => toggleMutation.mutate({ key: ix.key, isEnabled: !ix.isEnabled })}
                  >
                    {ix.isEnabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="outline" onClick={() => handleTest(ix.key)}>
                    Test
                  </Button>
                  <Button variant="outline" onClick={() => openEdit(ix)}>
                    Edit
                  </Button>
                  <Button variant="outline" onClick={() => deleteMutation.mutate({ key: ix.key })}>
                    Delete
                  </Button>
                </div>
                {testResults[ix.key] && (
                  <div className="mt-1 text-xs">{testResults[ix.key]}</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <IndexerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSave={handleSave}
      />
    </div>
  );
}

function IndexerModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: IndexerConfig | null;
  onSave: (values: { key: string; kind: 'torznab' | 'rss'; name: string; config: any }) => void;
}) {
  const [kind, setKind] = useState<'torznab' | 'rss'>(initial?.kind || 'torznab');
  const [key, setKey] = useState(initial?.key || '');
  const [name, setName] = useState(initial?.name || '');
  const [baseUrl, setBaseUrl] = useState(initial?.config?.baseUrl || '');
  const [apiKey, setApiKey] = useState(initial?.config?.apiKey || '');
  const [categories, setCategories] = useState(
    initial?.config?.categories ? initial.config.categories.join(',') : '',
  );
  const [url, setUrl] = useState(initial?.config?.url || '');

  useEffect(() => {
    if (initial) {
      setKind(initial.kind);
      setKey(initial.key);
      setName(initial.name);
      setBaseUrl(initial.config?.baseUrl || '');
      setApiKey(initial.config?.apiKey || '');
      setCategories(initial.config?.categories ? initial.config.categories.join(',') : '');
      setUrl(initial.config?.url || '');
    } else {
      setKind('torznab');
      setKey('');
      setName('');
      setBaseUrl('');
      setApiKey('');
      setCategories('');
      setUrl('');
    }
  }, [initial, open]);

  const save = () => {
    if (kind === 'torznab') {
      onSave({
        key,
        kind,
        name,
        config: {
          baseUrl,
          apiKey,
          categories: categories
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
        },
      });
    } else {
      onSave({
        key,
        kind,
        name,
        config: { url },
      });
    }
  };

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full rounded bg-white p-4 text-gray-900 shadow dark:bg-gray-800 dark:text-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg mb-2">{initial ? 'Edit Indexer' : 'Add Indexer'}</h2>
        {!initial && (
          <div className="mb-2 space-x-4">
            <label className="inline-flex items-center gap-1">
              <input
                type="radio"
                checked={kind === 'torznab'}
                onChange={() => setKind('torznab')}
              />
              Torznab
            </label>
            <label className="inline-flex items-center gap-1">
              <input type="radio" checked={kind === 'rss'} onChange={() => setKind('rss')} />
              RSS
            </label>
          </div>
        )}
        <div className="space-y-2">
          <div>
            <label className="block mb-1">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block mb-1">Key</label>
            <Input value={key} onChange={(e) => setKey(e.target.value)} disabled={!!initial} />
          </div>
          {kind === 'torznab' ? (
            <>
              <div>
                <label className="block mb-1">Base URL</label>
                <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1">API Key</label>
                <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1">Categories</label>
                <Input
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  placeholder="Comma separated"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block mb-1">URL</label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </div>
      </div>
    </div>
  );
}

export default SettingsIndexers;
