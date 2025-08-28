import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { emulationstation } from '@gamearr/adapters';
import fs from 'node:fs/promises';
import path from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  async emulationstation() {
    const tmp = await mkdtemp(path.join(tmpdir(), 'es-export-'));
    await emulationstation.exportAll({ prisma: this.prisma, outDir: tmp });
    const target = path.resolve('emulationstation');
    await fs.rm(target, { recursive: true, force: true });
    await fs.rename(tmp, target);
    return { status: 'ok' };
  }
}
