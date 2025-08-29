import { useApiQuery } from '../lib/api';
import { ResponsiveContainer, LineChart as ReLineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart as ReBarChart, Bar } from 'recharts';

interface SummaryMetrics {
  games: number;
  unmatched: number;
  importSuccessRate7d: number;
  queueDepth: number;
  avgDownloadToImport: number;
}

interface TimeseriesMetrics {
  importsPerDay: { date: string; count: number }[];
  providerLatency: { bucket: string; count: number }[];
}

export function Insights() {
  const { data: summary } = useApiQuery<SummaryMetrics>({
    queryKey: ['metrics', 'summary'],
    path: '/metrics/summary',
    refetchInterval: 60_000,
  });
  const { data: timeseries } = useApiQuery<TimeseriesMetrics>({
    queryKey: ['metrics', 'timeseries'],
    path: '/metrics/timeseries',
    refetchInterval: 60_000,
  });

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-xl mb-4">Insights</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded bg-gray-100 p-4 dark:bg-gray-800">
          <div className="text-sm text-gray-500">Games</div>
          <div className="text-2xl font-semibold">{summary?.games ?? '-'}</div>
        </div>
        <div className="rounded bg-gray-100 p-4 dark:bg-gray-800">
          <div className="text-sm text-gray-500">Unmatched</div>
          <div className="text-2xl font-semibold">{summary?.unmatched ?? '-'}</div>
        </div>
        <div className="rounded bg-gray-100 p-4 dark:bg-gray-800">
          <div className="text-sm text-gray-500">Import Success Rate (7d)</div>
          <div className="text-2xl font-semibold">
            {summary ? `${(summary.importSuccessRate7d * 100).toFixed(1)}%` : '-'}
          </div>
        </div>
        <div className="rounded bg-gray-100 p-4 dark:bg-gray-800">
          <div className="text-sm text-gray-500">Queue Depth</div>
          <div className="text-2xl font-semibold">{summary?.queueDepth ?? '-'}</div>
        </div>
        <div className="rounded bg-gray-100 p-4 dark:bg-gray-800">
          <div className="text-sm text-gray-500">Avg Download → Import</div>
          <div className="text-2xl font-semibold">
            {summary ? `${summary.avgDownloadToImport.toFixed(1)}s` : '-'}
          </div>
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="h-64">
          <h2 className="mb-2 font-medium">Imports per Day</h2>
          <ResponsiveContainer width="100%" height="100%">
            <ReLineChart data={timeseries?.importsPerDay || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" />
            </ReLineChart>
          </ResponsiveContainer>
        </div>
        <div className="h-64">
          <h2 className="mb-2 font-medium">Provider Latency (ms)</h2>
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={timeseries?.providerLatency || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Insights;
