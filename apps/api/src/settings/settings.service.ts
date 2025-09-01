import { Injectable, BadRequestException } from '@nestjs/common';
import { readSettings, writeSettings, config } from '@gamearr/shared';
import { renderTemplate } from '@gamearr/domain';
import { Queue } from 'bullmq';

@Injectable()
export class SettingsService {
  private async clearSearchCache() {
    if (!config.redisUrl) return;
    const queue = new Queue('settings-cache-clear', {
      connection: { url: config.redisUrl },
    });
    try {
      const client = await queue.client;
      const keys = await client.keys('search:*');
      if (keys.length) {
        await client.del(keys);
      }
    } finally {
      await queue.disconnect();
    }
  }
  async getOrganize() {
    const settings = await readSettings();
    return { template: settings.organizeTemplate };
  }

  async setOrganize(template: string) {
    try {
      renderTemplate({ game: 'Game', platform: 'Platform', disc: '', ext: '.bin' }, template);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
    const settings = await readSettings();
    const updated = { ...settings, organizeTemplate: template };
    await writeSettings(updated);
    await this.clearSearchCache();
    return { template };
  }

  async getProviders() {
    const settings = await readSettings();
    const { providers = {}, downloads = {}, features = {} } = settings as any;
    return { providers, downloads, features };
  }

  async setProviders(body: { providers: any; downloads?: any; features: Record<string, boolean> }) {
    const settings = await readSettings();
    const updated = {
      ...settings,
      providers: body.providers,
      downloads: { ...settings.downloads, ...(body.downloads || {}) },
      features: body.features,
    };
    await writeSettings(updated);
    await this.clearSearchCache();
    return {
      providers: updated.providers,
      downloads: updated.downloads,
      features: updated.features,
    };
  }

  async getQbit() {
    const settings = await readSettings();
    return settings.downloads.qbittorrent;
  }

  async setQbit(body: any) {
    const settings = await readSettings();
    const updated = {
      ...settings,
      downloads: { ...settings.downloads, qbittorrent: body },
    };
    await writeSettings(updated);
    await this.clearSearchCache();
    return body;
  }
}

