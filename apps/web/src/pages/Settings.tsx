import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApiQuery } from '../lib/api';
import { Input } from '../components/ui/input';
import { useTranslation } from 'react-i18next';

export function Settings() {
  const { t } = useTranslation('settings');
  const { data } = useApiQuery<any>({ queryKey: ['health'], path: '/health' });
  const [regionPriority, setRegionPriority] = useState(
    localStorage.getItem('regionPriority') || 'USA,Europe,Japan',
  );
  const [preferVerified, setPreferVerified] = useState(
    localStorage.getItem('preferVerified') !== 'false',
  );
  const [preferRevision, setPreferRevision] = useState(
    localStorage.getItem('preferRevision') !== 'false',
  );

  return (
    <div className="p-4 space-y-4">
      <div>
        <Link to="/settings/organize" className="text-blue-500 underline">
          {t('organizeSettings')}
        </Link>
      </div>
      <div>
        <Link to="/settings/exporters" className="text-blue-500 underline">
          {t('exporters')}
        </Link>
      </div>
      <div>
        <Link to="/settings/providers" className="text-blue-500 underline">
          {t('providers')}
        </Link>
      </div>
      <div>
        <Link to="/settings/indexers" className="text-blue-500 underline">
          {t('indexers')}
        </Link>
      </div>
      <div>
        <Link to="/settings/platforms" className="text-blue-500 underline">
          {t('platforms')}
        </Link>
      </div>
      <div>{t('apiHealth', { status: data ? 'ok' : '...' })}</div>
      <div>
        <label className="block mb-1">{t('regionPriority')}</label>
        <Input
          value={regionPriority}
          onChange={(e) => {
            setRegionPriority(e.target.value);
            localStorage.setItem('regionPriority', e.target.value);
          }}
          aria-label={t('regionPriority')}
        />
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferVerified}
            onChange={(e) => {
              setPreferVerified(e.target.checked);
              localStorage.setItem('preferVerified', String(e.target.checked));
            }}
          />
          {t('preferVerified')}
        </label>
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferRevision}
            onChange={(e) => {
              setPreferRevision(e.target.checked);
              localStorage.setItem('preferRevision', String(e.target.checked));
            }}
          />
          {t('preferRevision')}
        </label>
      </div>
    </div>
  );
}
