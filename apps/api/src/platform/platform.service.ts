import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Queue } from 'bullmq';
import { promises as fs, createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { config } from '@gamearr/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePlatformDto, UpdatePlatformDto } from './dto';

@Injectable()
export class PlatformService {
  private readonly datQueue?: Queue;

  private readonly execFileAsync = promisify(execFile);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    if (config.redisUrl) {
      this.datQueue = new Queue('dat', { connection: { url: config.redisUrl } });
    }
  }

  findAll() {
    return this.prisma.platform.findMany({
      select: {
        id: true,
        name: true,
        aliases: true,
        activeDatFile: {
          select: {
            id: true,
            filename: true,
            version: true,
            uploadedAt: true,
            activatedAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const platform = await this.prisma.platform.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        aliases: true,
        activeDatFile: {
          select: {
            id: true,
            filename: true,
            version: true,
            uploadedAt: true,
            activatedAt: true,
          },
        },
        datFiles: {
          orderBy: { uploadedAt: 'desc' },
          select: {
            id: true,
            filename: true,
            version: true,
            uploadedAt: true,
            activatedAt: true,
          },
        },
      },
    });
    if (!platform) throw new NotFoundException('Platform not found');
    return platform;
  }

  create(data: CreatePlatformDto) {
    return this.prisma.platform.create({
      data: { name: data.name, aliases: data.aliases ?? [], extensions: [] },
      select: { id: true, name: true, aliases: true },
    });
  }

  async update(id: string, data: UpdatePlatformDto) {
    try {
      return await this.prisma.platform.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.aliases ? { aliases: data.aliases } : {}),
        },
        select: { id: true, name: true, aliases: true },
      });
    } catch (err: any) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException('Platform not found');
      }
      throw err;
    }
  }

  async remove(id: string) {
    const libraryCount = await this.prisma.library.count({ where: { platformId: id } });
    if (libraryCount > 0) {
      throw new BadRequestException('Platform has associated libraries');
    }
    try {
      await this.prisma.platform.delete({ where: { id } });
    } catch (err: any) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException('Platform not found');
      }
      throw err;
    }
    return { id };
  }

  async uploadDat(
    platformId: string,
    file: { path: string; mimetype: string; originalname: string; size: number },
  ) {
    if (!file) throw new BadRequestException('File is required');

    const maxBytes = config.maxDatUploadMB * 1024 * 1024;
    if (file.size > maxBytes) {
      await fs.unlink(file.path).catch(() => {});
      throw new BadRequestException(`File exceeds ${config.maxDatUploadMB}MB limit`);
    }

    const allowed: Record<string, string> = {
      'text/xml': 'xml',
      'application/xml': 'xml',
      'application/zip': 'zip',
      'application/x-7z-compressed': '7z',
    };

    const ext = allowed[file.mimetype];
    if (!ext) {
      await fs.unlink(file.path).catch(() => {});
      throw new BadRequestException('Unsupported file type');
    }

    try {
      await this.validateDatFile(file.path, ext);
    } catch (err) {
      await fs.unlink(file.path).catch(() => {});
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Invalid DAT file');
    }

    const hash = createHash('sha256');
    await new Promise<void>((resolve, reject) => {
      const stream = createReadStream(file.path);
      stream.on('error', reject);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve());
    });
    const sha256 = hash.digest('hex');
    const stat = await fs.stat(file.path);

    const existing = await this.prisma.datFile.findFirst({
      where: { platformId, sha256 },
      select: { id: true, path: true },
    });

    if (existing) {
      await fs.unlink(file.path).catch(() => {});
      await this.prisma.datFile.update({
        where: { id: existing.id },
        data: { uploadedAt: new Date(), filename: file.originalname },
      });
      return { datFileId: existing.id, queued: false };
    }

    const dir = config.paths.platformDatDir(platformId);
    await fs.mkdir(dir, { recursive: true });
    const filename = `${sha256}.${ext}`;
    const dest = join(dir, filename);
    await fs.rename(file.path, dest);

    const datFile = await this.prisma.datFile.create({
      data: {
        platformId,
        filename: file.originalname,
        path: dest,
        size: BigInt(stat.size),
        sha256,
        source: 'upload',
      },
      select: { id: true },
    });

    if (this.datQueue) {
      await this.datQueue.add('import', { datFileId: datFile.id });
    }

    return { datFileId: datFile.id, queued: true };
  }

  private async validateDatFile(path: string, ext: string) {
    const isDat = (xml: string) => /<datafile/i.test(xml);
    if (ext === 'xml') {
      const xml = await fs.readFile(path, 'utf8');
      if (!isDat(xml)) throw new BadRequestException('Invalid DAT file');
      return;
    }
    if (ext === 'zip') {
      const { stdout: list } = await this.execFileAsync('unzip', ['-Z1', path]);
      const entries = list
        .toString()
        .split(/\r?\n/)
        .filter(Boolean);
      if (entries.length === 0) throw new BadRequestException('Archive is empty');
      if (entries.length > 1 && !/(\.dat|\.xml)$/i.test(entries[0])) {
        throw new BadRequestException('First entry must be DAT/XML');
      }
      const entry = entries[0];
      if (!/(\.dat|\.xml)$/i.test(entry)) {
        throw new BadRequestException('No DAT file in archive');
      }
      const { stdout } = await this.execFileAsync('unzip', ['-p', path, entry]);
      const xml = stdout.toString();
      if (!isDat(xml)) throw new BadRequestException('Invalid DAT file');
      return;
    }
    if (ext === '7z') {
      const { stdout: list } = await this.execFileAsync('7z', ['l', '-ba', path]);
      const entries = list
        .toString()
        .split(/\r?\n/)
        .map((l) => l.trim().split(/\s+/).pop() || '')
        .filter(Boolean);
      if (entries.length === 0) throw new BadRequestException('Archive is empty');
      if (entries.length > 1 && !/(\.dat|\.xml)$/i.test(entries[0])) {
        throw new BadRequestException('First entry must be DAT/XML');
      }
      const entry = entries[0];
      if (!/(\.dat|\.xml)$/i.test(entry)) {
        throw new BadRequestException('No DAT file in archive');
      }
      const { stdout } = await this.execFileAsync('7z', ['x', '-so', path, entry]);
      const xml = stdout.toString();
      if (!isDat(xml)) throw new BadRequestException('Invalid DAT file');
      return;
    }
    throw new BadRequestException('Unsupported file type');
  }

  async activateDat(platformId: string, datFileId: string) {
    const datFile = await this.prisma.datFile.findUnique({
      where: { id: datFileId },
      select: { platformId: true },
    });
    if (!datFile || datFile.platformId !== platformId) {
      throw new NotFoundException('DAT file not found');
    }

    await this.prisma.$transaction([
      this.prisma.platform.update({
        where: { id: platformId },
        data: { activeDatFileId: datFileId },
      }),
      this.prisma.datFile.update({
        where: { id: datFileId },
        data: { activatedAt: new Date() },
      }),
    ]);

    if (this.datQueue) {
      await this.datQueue.add('recheck-platform', { platformId });
    }

    return { id: platformId, datFileId };
  }

  async recheckDat(platformId: string) {
    const platform = await this.prisma.platform.findUnique({
      where: { id: platformId },
      select: { id: true },
    });
    if (!platform) throw new NotFoundException('Platform not found');

    if (this.datQueue) {
      await this.datQueue.add('recheck-platform', { platformId });
      return { queued: true };
    }
    return { queued: false };
  }

  async deactivateDat(platformId: string, datFileId: string) {
    const datFile = await this.prisma.datFile.findUnique({
      where: { id: datFileId },
      select: { platformId: true },
    });
    if (!datFile || datFile.platformId !== platformId) {
      throw new NotFoundException('DAT file not found');
    }

    const platform = await this.prisma.platform.findUnique({
      where: { id: platformId },
      select: { activeDatFileId: true },
    });
    if (!platform) throw new NotFoundException('Platform not found');
    if (platform.activeDatFileId !== datFileId) return { id: platformId, datFileId };

    await this.prisma.$transaction([
      this.prisma.platform.update({
        where: { id: platformId },
        data: { activeDatFileId: null },
      }),
      this.prisma.datFile.update({
        where: { id: datFileId },
        data: { activatedAt: null },
      }),
    ]);

    return { id: platformId, datFileId };
  }
}

