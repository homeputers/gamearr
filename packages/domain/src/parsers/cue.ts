// @ts-nocheck
export interface CueFile {
  filename: string;
  track: number;
}

export interface CueSheet {
  files: CueFile[];
}

export function parseCue(content: string): CueSheet {
  // TODO: implement full cue parser
  const files: CueFile[] = [];
  const lines = content.split(/\r?\n/);
  let currentFile: string | null = null;
  for (const line of lines) {
    const fileMatch = line.match(/^FILE\s+"(.+?)"/i);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }
    const trackMatch = line.match(/^\s*TRACK\s+(\d+)/i);
    if (trackMatch && currentFile) {
      files.push({ filename: currentFile, track: Number(trackMatch[1]) });
    }
  }
  return { files };
}
