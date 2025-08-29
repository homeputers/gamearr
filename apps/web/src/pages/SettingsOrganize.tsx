import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, ApiError, useApiQuery, useApiMutation } from '../lib/api';

export function SettingsOrganize() {
  const [template, setTemplate] = useState('');
  const [artifactId, setArtifactId] = useState('');

  const { data: settings } = useApiQuery<{ template: string }>({
    queryKey: ['settings-organize'],
    path: '/settings/organize',
  });

  useEffect(() => {
    if (settings?.template) {
      setTemplate(settings.template);
    }
  }, [settings]);

  const { data: artifacts } = useApiQuery<any[]>({
    queryKey: ['artifacts-unmatched'],
    path: '/artifacts/unmatched',
  });

  const previewQuery = useQuery<{ path: string }, ApiError>({
    queryKey: ['organize-preview', artifactId, template],
    queryFn: () =>
      apiFetch('/imports/organize/preview', {
        method: 'POST',
        body: JSON.stringify({ artifactId, template }),
      }),
    enabled: !!artifactId && !!template,
  });

  const saveMutation = useApiMutation<{ template: string }, { template: string }>(
    (vars) => ({
      path: '/settings/organize',
      init: { method: 'PUT', body: JSON.stringify({ template: vars.template }) },
    }),
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-1">Rename Template</label>
        <textarea
          className="w-full border rounded p-2 h-32"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        />
      </div>
      <div>
        <label className="block mb-1">Sample Artifact</label>
        <select
          className="border rounded p-2 w-full"
          value={artifactId}
          onChange={(e) => setArtifactId(e.target.value)}
        >
          <option value="">Select artifact</option>
          {artifacts?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.path}
            </option>
          ))}
        </select>
      </div>
      <div className="p-2 border rounded min-h-[2rem]">
        {previewQuery.data?.path}
        {previewQuery.error && <div className="text-red-600">{previewQuery.error.message}</div>}
      </div>
      <div>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => saveMutation.mutate({ template })}
        >
          Save
        </button>
        {saveMutation.error && (
          <div className="text-red-600 mt-1">{saveMutation.error.message}</div>
        )}
      </div>
    </div>
  );
}

export default SettingsOrganize;

