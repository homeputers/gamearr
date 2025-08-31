import { useEffect, useState } from 'react';
import { useApiQuery, useApiMutation, ApiError } from '../lib/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

interface ProviderSettings {
  providers: {
    rawgKey?: string;
    igdbClientId?: string;
    igdbClientSecret?: string;
    tgdbApiKey?: string;
  };
  downloads?: {
    transmission: DownloadClient;
    sab: DownloadClient;
  };
  features: Record<string, boolean>;
}

interface DownloadClient {
  baseUrl?: string;
  username?: string;
  password?: string;
  category?: string;
  label?: string;
}

export function SettingsProviders() {
  const { data } = useApiQuery<ProviderSettings>({
    queryKey: ['settings-providers'],
    path: '/settings/providers',
  });

  const { data: qbData } = useApiQuery<DownloadClient>({
    queryKey: ['settings-qb'],
    path: '/settings/downloads/qbit',
  });

  const [rawgKey, setRawgKey] = useState('');
  const [igdbClientId, setIgdbClientId] = useState('');
  const [igdbClientSecret, setIgdbClientSecret] = useState('');
  const [tgdbApiKey, setTgdbApiKey] = useState('');

  const [qb, setQb] = useState<DownloadClient>({});
  const [tr, setTr] = useState<DownloadClient>({});
  const [sab, setSab] = useState<DownloadClient>({});

  const [experimental, setExperimental] = useState(false);

  useEffect(() => {
    if (data) {
      setRawgKey(data.providers.rawgKey || '');
      setIgdbClientId(data.providers.igdbClientId || '');
      setIgdbClientSecret(data.providers.igdbClientSecret || '');
      setTgdbApiKey(data.providers.tgdbApiKey || '');
      if (data.downloads) {
        setTr(data.downloads.transmission || {});
        setSab(data.downloads.sab || {});
      }
      setExperimental(data.features.experimental || false);
    }
  }, [data]);

  useEffect(() => {
    if (qbData) {
      setQb(qbData);
    }
  }, [qbData]);

  const saveProviders = useApiMutation<ProviderSettings, ProviderSettings>((body) => ({
    path: '/settings/providers',
    init: { method: 'PUT', body: JSON.stringify(body) },
  }), {
    onError: (err) => toast.error(err.message),
  });

  const saveQb = useApiMutation<DownloadClient, DownloadClient>((body) => ({
    path: '/settings/downloads/qbit',
    init: { method: 'PUT', body: JSON.stringify(body) },
  }), {
    onError: (err) => toast.error(err.message),
  });

  const testMutation = useApiMutation<{ ok: boolean }, { provider: string; credentials: any }>(
    ({ provider, credentials }) => ({
      path: '/providers/test',
      init: { method: 'POST', body: JSON.stringify({ provider, credentials }) },
    }),
  );

  const testProvider = (provider: string, credentials: any) => {
    testMutation.mutate(
      { provider, credentials } as any,
      {
        onSuccess: () => toast('Credentials valid'),
        onError: (err: ApiError) => toast.error(err.message),
      },
    );
  };

  const handleSave = async () => {
    try {
      await Promise.all([
        saveProviders.mutateAsync({
          providers: { rawgKey, igdbClientId, igdbClientSecret, tgdbApiKey },
          downloads: { transmission: tr, sab },
          features: { experimental },
        }),
        saveQb.mutateAsync(qb),
      ]);
      toast('Settings saved');
    } catch {}
  };

  const testQb = () => {
    qbTest.mutate(undefined, {
      onSuccess: (res) => {
        if (res.ok) toast('Connection OK');
        else toast.error('Connection failed');
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const qbTest = useApiMutation<{ ok: boolean }>(() => ({ path: '/downloads/test' }));

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Providers</h2>
        <div className="space-y-2">
          <label className="block">RAWG API Key</label>
          <div className="flex gap-2">
            <Input type="password" value={rawgKey} onChange={(e) => setRawgKey(e.target.value)} />
            <Button onClick={() => testProvider('rawg', { apiKey: rawgKey })}>Validate</Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block">IGDB Client ID</label>
          <Input value={igdbClientId} onChange={(e) => setIgdbClientId(e.target.value)} />
          <label className="block mt-2">IGDB Client Secret</label>
          <div className="flex gap-2">
            <Input
              type="password"
              value={igdbClientSecret}
              onChange={(e) => setIgdbClientSecret(e.target.value)}
            />
            <Button onClick={() => testProvider('igdb', { clientId: igdbClientId, clientSecret: igdbClientSecret })}>
              Validate
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block">TGDB API Key</label>
          <div className="flex gap-2">
            <Input type="password" value={tgdbApiKey} onChange={(e) => setTgdbApiKey(e.target.value)} />
            <Button onClick={() => testProvider('tgdb', { apiKey: tgdbApiKey })}>Validate</Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Download Clients</h2>
        <div className="space-y-2">
          <h3 className="font-medium">qBittorrent</h3>
          <Input
            placeholder="Base URL"
            value={qb.baseUrl || ''}
            onChange={(e) => setQb({ ...qb, baseUrl: e.target.value })}
          />
          <Input
            placeholder="Username"
            value={qb.username || ''}
            onChange={(e) => setQb({ ...qb, username: e.target.value })}
          />
          <Input
            type="password"
            placeholder="Password"
            value={qb.password || ''}
            onChange={(e) => setQb({ ...qb, password: e.target.value })}
          />
          <Input
            placeholder="Category"
            value={qb.category || ''}
            onChange={(e) => setQb({ ...qb, category: e.target.value })}
          />
          <Button onClick={testQb}>Test Connection</Button>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Transmission</h3>
          <Input
            placeholder="Base URL"
            value={tr.baseUrl || ''}
            onChange={(e) => setTr({ ...tr, baseUrl: e.target.value })}
          />
          <Input
            placeholder="Username"
            value={tr.username || ''}
            onChange={(e) => setTr({ ...tr, username: e.target.value })}
          />
          <Input
            type="password"
            placeholder="Password"
            value={tr.password || ''}
            onChange={(e) => setTr({ ...tr, password: e.target.value })}
          />
          <Input
            placeholder="Label"
            value={tr.label || ''}
            onChange={(e) => setTr({ ...tr, label: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">SAB</h3>
          <Input
            placeholder="Base URL"
            value={sab.baseUrl || ''}
            onChange={(e) => setSab({ ...sab, baseUrl: e.target.value })}
          />
          <Input
            placeholder="Username"
            value={sab.username || ''}
            onChange={(e) => setSab({ ...sab, username: e.target.value })}
          />
          <Input
            type="password"
            placeholder="Password"
            value={sab.password || ''}
            onChange={(e) => setSab({ ...sab, password: e.target.value })}
          />
          <Input
            placeholder="Category"
            value={sab.category || ''}
            onChange={(e) => setSab({ ...sab, category: e.target.value })}
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Features</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={experimental}
            onChange={(e) => setExperimental(e.target.checked)}
          />
          Enable experimental features
        </label>
      </section>

      <Button onClick={handleSave} disabled={saveProviders.isPending || saveQb.isPending}>
        Save
      </Button>
    </div>
  );
}

export default SettingsProviders;
