import { useEffect, useState } from 'react';

export const Settings = () => {
  const [regionPriority, setRegionPriority] = useState(
    localStorage.getItem('regionPriority') || 'USA,Europe,Japan',
  );
  const [preferVerified, setPreferVerified] = useState(
    localStorage.getItem('preferVerified') !== 'false',
  );
  const [preferRevision, setPreferRevision] = useState(
    localStorage.getItem('preferRevision') !== 'false',
  );

  useEffect(() => {
    localStorage.setItem('regionPriority', regionPriority);
  }, [regionPriority]);
  useEffect(() => {
    localStorage.setItem('preferVerified', String(preferVerified));
  }, [preferVerified]);
  useEffect(() => {
    localStorage.setItem('preferRevision', String(preferRevision));
  }, [preferRevision]);

  return (
    <div>
      <h2>Settings</h2>
      <div>
        <label>Region Priority (comma separated):</label>
        <input
          value={regionPriority}
          onChange={(e) => setRegionPriority(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={preferVerified}
            onChange={(e) => setPreferVerified(e.target.checked)}
          />
          Prefer verified dumps
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={preferRevision}
            onChange={(e) => setPreferRevision(e.target.checked)}
          />
          Prefer highest revision
        </label>
      </div>
    </div>
  );
};
