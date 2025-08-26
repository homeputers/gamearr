// @ts-nocheck
export interface GdiTrack {
  track: number;
  lba: number;
  filename: string;
}

export interface GdiImage {
  tracks: GdiTrack[];
}

export function parseGdi(content: string): GdiImage {
  // TODO: implement full GDI parser
  const lines = content.trim().split(/\r?\n/);
  const tracks: GdiTrack[] = [];
  for (const line of lines.slice(1)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 6) {
      tracks.push({
        track: Number(parts[0]),
        lba: Number(parts[1]),
        filename: parts[4].replace(/"/g, ''),
      });
    }
  }
  return { tracks };
}
