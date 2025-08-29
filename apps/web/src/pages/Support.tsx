import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';
import { Button } from '../components/ui/button';

interface LogEntry {
  level: string;
  time: number;
  msg: string;
  module?: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const LIMIT = 100;

export function Support() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [level, setLevel] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<LogEntry[]>(
      `/support/logs?offset=${offset}&limit=${LIMIT}&level=${level}&module=${moduleFilter}`,
    )
      .then((data) => {
        if (offset === 0) setLogs(data);
        else setLogs((prev) => [...data, ...prev]);
      })
      .catch(() => {});
  }, [offset, level, moduleFilter]);

  useEffect(() => {
    const es = new EventSource(
      `${API_BASE}/support/logs/stream?level=${level}&module=${moduleFilter}`,
    );
    es.onmessage = (e) => {
      const entry: LogEntry = JSON.parse(e.data);
      setLogs((prev) => [...prev, entry]);
    };
    return () => es.close();
  }, [level, moduleFilter]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const loadMore = () => setOffset((o) => o + LIMIT);

  const generateBundle = async () => {
    const res = await fetch(`${API_BASE}/support/bundle`, { method: 'POST' });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'support-bundle.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl">Support</h1>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="border p-1 text-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        >
          <option value="">All Levels</option>
          <option value="trace">Trace</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
          <option value="fatal">Fatal</option>
        </select>
        <input
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          placeholder="Module"
          className="border p-1 text-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
        <Button onClick={generateBundle}>Generate Support Bundle</Button>
      </div>
      <div className="border rounded p-2 h-96 overflow-y-auto bg-gray-50 dark:bg-gray-900 text-xs font-mono text-gray-800 dark:text-gray-100">
        {logs.map((l, idx) => (
          <div key={idx}>
            [{new Date(l.time).toISOString()}] {l.level}{' '}
            {l.module ? `[${l.module}] ` : ''}{l.msg}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <Button variant="ghost" onClick={loadMore}>
        Load older
      </Button>
    </div>
  );
}

