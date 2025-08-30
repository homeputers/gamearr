import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePlatformDto, UpdatePlatformDto } from './dto';

@Injectable()
export class PlatformService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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
}

