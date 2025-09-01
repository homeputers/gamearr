import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { createTorznabIndexer, createRssMagnetIndexer } from '@gamearr/adapters';
import { registerIndexer, unregisterIndexer } from '@gamearr/domain';

interface IndexerConfig {
  key: string;
  kind: string;
  name: string;
  config: any;
  isEnabled: boolean;
}

@Injectable()
export class IndexersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private buildIndexer(cfg: IndexerConfig) {
    if (cfg.kind === 'torznab') {
      return createTorznabIndexer({
        key: cfg.key,
        name: cfg.name,
        ...(cfg.config as any),
      });
    }
    if (cfg.kind === 'rss') {
      return createRssMagnetIndexer({
        key: cfg.key,
        name: cfg.name,
        ...(cfg.config as any),
      });
    }
    throw new Error('unsupported indexer kind');
  }

  async bootstrap() {
    const configs = await this.prisma.indexerConfig.findMany({
      where: { isEnabled: true },
    });
    configs.forEach((cfg: IndexerConfig) =>
      registerIndexer(this.buildIndexer(cfg)),
    );
  }

  list() {
    return this.prisma.indexerConfig.findMany();
  }

  async create(data: {
    key: string;
    kind: string;
    name: string;
    config: any;
  }) {
    const created = await this.prisma.indexerConfig.create({ data });
    if (created.isEnabled) {
      registerIndexer(this.buildIndexer(created));
    }
    return created;
  }

  async update(
    key: string,
    data: { name?: string; config?: any; isEnabled?: boolean },
  ) {
    const updated = await this.prisma.indexerConfig.update({
      where: { key },
      data,
    });
    unregisterIndexer(key);
    if (updated.isEnabled) {
      registerIndexer(this.buildIndexer(updated));
    }
    return updated;
  }

  async remove(key: string) {
    await this.prisma.indexerConfig.delete({ where: { key } });
    unregisterIndexer(key);
    return { status: 'removed' };
  }

  async test(key: string) {
    const cfg = await this.prisma.indexerConfig.findUnique({ where: { key } });
    if (!cfg) return { ok: false, error: 'not found' };
    try {
      const ix = this.buildIndexer(cfg);
      await ix.search({ title: 'test', platform: '_any_' });
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }
}

