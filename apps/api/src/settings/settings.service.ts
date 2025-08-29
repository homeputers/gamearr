import { Injectable, BadRequestException } from '@nestjs/common';
import { readSettings, writeSettings } from '@gamearr/shared';
import { renderTemplate } from '@gamearr/domain';

@Injectable()
export class SettingsService {
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
    return { template };
  }

  async getProviders() {
    const settings = await readSettings();
    const { providers = {}, downloads = {}, features = {} } = settings as any;
    return { providers, downloads, features };
  }

  async setProviders(body: { providers: any; downloads: any; features: Record<string, boolean> }) {
    const settings = await readSettings();
    const updated = {
      ...settings,
      providers: body.providers,
      downloads: body.downloads,
      features: body.features,
    };
    await writeSettings(updated);
    return body;
  }
}

