import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { Input } from '../components/ui/input';

export function Settings() {
  const { data } = useQuery({ queryKey: ['health'], queryFn: api.health });
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
      <div>API health: {data ? 'ok' : '...'}</div>
      <div>
        <label className="block mb-1">Region Priority</label>
        <Input
          value={regionPriority}
          onChange={(e) => {
            setRegionPriority(e.target.value);
            localStorage.setItem('regionPriority', e.target.value);
          }}
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
          Prefer verified dumps
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
          Prefer highest revision
        </label>
      </div>
    </div>
  );
}
