import { Injectable } from '@nestjs/common';
import { promises as fs, watch, createReadStream, existsSync } from 'node:fs';
import { logFilePath, config } from '@gamearr/shared';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import archiver from 'archiver';
import { Response } from 'express';

interface LogEntry {
  level: string;
  time: number;
  msg: string;
  module?: string;
  [key: string]: any;
}

interface LogQuery {
  level?: string;
  module?: string;
  offset: number;
  limit: number;
}

const levelMap: Record<number, string> = {
  10: 'trace',
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'fatal',
};

@Injectable()
export class SupportService {
  private parse(line: string): LogEntry | null {
    try {
      const obj = JSON.parse(line);
      const level = levelMap[obj.level] || obj.level;
      return { ...obj, level };
    } catch {
      return null;
    }
  }

  private passes(entry: LogEntry, q: { level?: string; module?: string }) {
    if (q.level && entry.level !== q.level) return false;
    if (q.module && entry.module !== q.module) return false;
    return true;
  }

  async getLogs(q: LogQuery): Promise<LogEntry[]> {
    try {
      const data = await fs.readFile(logFilePath, 'utf8');
      const lines = data.split('\n').filter(Boolean);
      const entries = lines
        .map((l) => this.parse(l))
        .filter((e): e is LogEntry => !!e)
        .filter((e) => this.passes(e, q));
      const start = Math.max(entries.length - q.offset - q.limit, 0);
      const end = entries.length - q.offset;
      return entries.slice(start, end);
    } catch {
      return [];
    }
  }

  streamLogs(q: { level?: string; module?: string }): Observable<MessageEvent> {
    return new Observable((observer) => {
      let position = 0;
      fs.stat(logFilePath).then((s) => (position = s.size)).catch(() => (position = 0));
      const watcher = watch(logFilePath, async (event) => {
        if (event !== 'change') return;
        const stream = createReadStream(logFilePath, { start: position, encoding: 'utf8' });
        let buffer = '';
        stream.on('data', (chunk) => {
          position += Buffer.byteLength(chunk);
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const entry = this.parse(line);
            if (entry && this.passes(entry, q)) {
              observer.next({ data: entry });
            }
          }
        });
      });
      return () => watcher.close();
    });
  }

  async generateBundle(res: Response) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    const redacted = {
      ...config,
      rawgKey: config.rawgKey ? '[REDACTED]' : undefined,
      igdb: {
        ...config.igdb,
        clientSecret: config.igdb.clientSecret ? '[REDACTED]' : undefined,
      },
      qbittorrent: {
        ...config.qbittorrent,
        password: config.qbittorrent.password ? '[REDACTED]' : undefined,
      },
    };
    archive.append(JSON.stringify(redacted, null, 2), { name: 'config.json' });
    if (existsSync(logFilePath)) {
      archive.file(logFilePath, { name: 'app.log' });
    }
    await archive.finalize();
  }
}

