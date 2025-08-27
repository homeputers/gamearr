import { useEffect, useState } from 'react';

type Artifact = { id: string; path: string };
type SearchResult = { id: string; title: string };

export const App = () => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selected, setSelected] = useState<Artifact | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    fetch('/artifacts/unmatched')
      .then((r) => r.json())
      .then(setArtifacts);
  }, []);

  const open = async (a: Artifact) => {
    setSelected(a);
    const name = a.path.split('/').pop() || '';
    const res = await fetch(
      `/metadata/search?q=${encodeURIComponent(name)}&platform=`
    ).then((r) => r.json());
    setResults(res);
  };

  const approve = async (artifactId: string, providerId: string) => {
    await fetch(`/artifacts/${artifactId}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'rawg', providerId }),
    });
    setArtifacts(artifacts.filter((a) => a.id !== artifactId));
    setSelected(null);
    setResults([]);
  };

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1 }}>
        <ul>
          {artifacts.map((a) => (
            <li key={a.id} onClick={() => open(a)} style={{ cursor: 'pointer' }}>
              {a.path}
            </li>
          ))}
        </ul>
      </div>
      {selected && (
        <div style={{ width: '400px', borderLeft: '1px solid #ccc', padding: '1rem' }}>
          <h2>{selected.path}</h2>
          <ul>
            {results.map((r) => (
              <li key={r.id}>
                {r.title}{' '}
                <button onClick={() => approve(selected.id, r.id)}>Approve</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
