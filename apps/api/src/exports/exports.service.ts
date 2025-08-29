import { Injectable } from '@nestjs/common';
import { emulationstation } from '@gamearr/adapters';
import fs from 'node:fs/promises';
import path from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { PrismaService } from '../prisma/prisma.service.js';

interface ExportStatus {
  id: string;
  name: string;
  targetPath: string;
  lastExportedAt: Date | null;
  itemCount: number;
}

@Injectable()
export class ExportsService {
  private statuses: Record<string, ExportStatus> = {
    emulationstation: {
      id: 'emulationstation',
      name: 'EmulationStation/ES-DE',
      targetPath: path.resolve('emulationstation'),
      lastExportedAt: null,
      itemCount: 0,
    },
    playnite: {
      id: 'playnite',
      name: 'Playnite',
      targetPath: path.resolve('playnite'),
      lastExportedAt: null,
      itemCount: 0,
    },
    steam: {
      id: 'steam',
      name: 'Steam',
      targetPath: path.resolve('steam'),
      lastExportedAt: null,
      itemCount: 0,
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  getStatus() {
    return Object.values(this.statuses).map((s) => ({
      ...s,
      lastExportedAt: s.lastExportedAt?.toISOString() ?? null,
    }));
  }

  private async computeItemCount(): Promise<number> {
    return this.prisma.artifact.count({
      where: { releaseId: { not: null } },
    });
  }

  async emulationstation() {
    const tmp = await mkdtemp(path.join(tmpdir(), 'es-export-'));
    await emulationstation.exportAll({ prisma: this.prisma, outDir: tmp });
    const target = this.statuses.emulationstation.targetPath;
    await fs.rm(target, { recursive: true, force: true });
    await fs.rename(tmp, target);
    this.statuses.emulationstation.lastExportedAt = new Date();
    this.statuses.emulationstation.itemCount = await this.computeItemCount();
    return { status: 'ok' };
  }

  async playnite() {
    this.statuses.playnite.lastExportedAt = new Date();
    this.statuses.playnite.itemCount = await this.computeItemCount();
    return { status: 'ok' };
  }

  async steam() {
    this.statuses.steam.lastExportedAt = new Date();
    this.statuses.steam.itemCount = await this.computeItemCount();
    return { status: 'ok' };
  }
}
