import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useApiQuery, useApiMutation, ApiError } from '../lib/api';
import { getToken } from '../lib/token';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface DatFile {
  id: string;
  filename: string;
  size?: number;
  sha256?: string;
  uploadedAt: string;
  activatedAt?: string | null;
}

interface Platform {
  id: string;
  name: string;
  datFiles: DatFile[];
}

export function SettingsPlatform() {
  const { id } = useParams<{ id: string }>();
  const { data, refetch } = useApiQuery<Platform>({
    queryKey: ['platform', id],
    path: `/platforms/${id}`,
  });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showRecheckTip, setShowRecheckTip] = useState(false);

  const activateMutation = useApiMutation<unknown, { datFileId: string }>(
    ({ datFileId }) => ({
      path: `/platforms/${id}/dat/${datFileId}/activate`,
      init: { method: 'POST' },
    }),
    {
      onSuccess: () => {
        toast('Activated');
        refetch();
        setShowRecheckTip(true);
      },
      onError: (err: ApiError) => toast.error(err.message),
    },
  );

  const deactivateMutation = useApiMutation<unknown, { datFileId: string }>(
    ({ datFileId }) => ({
      path: `/platforms/${id}/dat/${datFileId}/deactivate`,
      init: { method: 'POST' },
    }),
    {
      onSuccess: () => {
        toast('Deactivated');
        refetch();
      },
      onError: (err: ApiError) => toast.error(err.message),
    },
  );

  const deleteMutation = useApiMutation<unknown, { datFileId: string }>(
    ({ datFileId }) => ({
      path: `/platforms/${id}/dat/${datFileId}`,
      init: { method: 'DELETE' },
    }),
    {
      onSuccess: () => {
        toast('Deleted');
        refetch();
      },
      onError: (err: ApiError) => toast.error(err.message),
    },
  );

  const recheckMutation = useApiMutation<unknown, void>(
    () => ({ path: `/platforms/${id}/dat/recheck`, init: { method: 'POST' } }),
    {
      onSuccess: () => toast('Recheck started'),
      onError: (err: ApiError) => toast.error(err.message),
    },
  );

  const handleUpload = (file: File) => {
    if (!file || !id) return;
    const formData = new FormData();
    formData.append('file', file);
    const xhr = new XMLHttpRequest();
    const token = getToken();
    xhr.open('POST', `${API_BASE}/platforms/${id}/dat/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      setUploadProgress(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        toast('Upload complete');
        refetch();
      } else {
        toast.error('Upload failed');
      }
    };
    xhr.onerror = () => {
      setUploadProgress(null);
      toast.error('Upload failed');
    };
    xhr.send(formData);
    toast('Upload started');
  };

  return (
    <div className="space-y-4">
      <div>
        <Link to="/settings/platforms" className="text-blue-500 underline">
          &lt; Back to Platforms
        </Link>
      </div>
      <h1 className="text-lg font-medium">{data?.name}</h1>
      <div className="space-y-2">
        <input
          type="file"
          accept=".xml,.dat,.zip,.7z"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
        />
        {uploadProgress !== null && <div>Uploading {uploadProgress}%</div>}
      </div>
      {showRecheckTip && (
        <div className="text-sm">
          DAT activated.{' '}
          <button
            className="text-blue-500 underline"
            onClick={() => {
              setShowRecheckTip(false);
              recheckMutation.mutate();
            }}
            disabled={recheckMutation.isPending}
          >
            Recheck unmatched?
          </button>
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2">Filename</th>
            <th className="text-left p-2">Size</th>
            <th className="text-left p-2">SHA256</th>
            <th className="text-left p-2">Uploaded</th>
            <th className="text-left p-2">Activated</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {data?.datFiles.map((df) => (
            <tr key={df.id} className="border-t">
              <td className="p-2">{df.filename}</td>
              <td className="p-2">
                {df.size ? `${(df.size / 1024 / 1024).toFixed(2)} MB` : '-'}
              </td>
              <td className="p-2">{df.sha256 ? df.sha256.slice(0, 8) : '-'}</td>
              <td className="p-2">
                {df.uploadedAt
                  ? new Date(df.uploadedAt).toLocaleDateString()
                  : '-'}
              </td>
              <td className="p-2">
                {df.activatedAt
                  ? new Date(df.activatedAt).toLocaleDateString()
                  : '-'}
              </td>
              <td className="p-2 space-x-2">
                {df.activatedAt ? (
                  <Button
                    size="sm"
                    onClick={() => deactivateMutation.mutate({ datFileId: df.id })}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={() => activateMutation.mutate({ datFileId: df.id })}
                    >
                      Activate
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => deleteMutation.mutate({ datFileId: df.id })}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SettingsPlatform;
