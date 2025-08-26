// @ts-nocheck
import { createHash } from 'node:crypto';
import { createReadStream, promises as fs } from 'node:fs';

export interface HashResult {
  size: number;
  crc32: string;
  sha1: string;
}

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c >>> 0;
}

function updateCrc(crc: number, buf: Buffer): number {
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc;
}

export async function hashFile(filePath: string): Promise<HashResult> {
  const stat = await fs.stat(filePath);
  const sha1 = createHash('sha1');
  let crc = 0xffffffff;

  return await new Promise<HashResult>((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on('data', (chunk: Buffer) => {
      sha1.update(chunk);
      crc = updateCrc(crc, chunk);
    });
    stream.on('error', reject);
    stream.on('end', () => {
      const crcHex = ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0');
      resolve({ size: stat.size, crc32: crcHex, sha1: sha1.digest('hex') });
    });
  });
}
