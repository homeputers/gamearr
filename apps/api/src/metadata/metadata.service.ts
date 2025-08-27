import { Injectable } from '@nestjs/common';
import { rawg } from '@gamearr/adapters';

@Injectable()
export class MetadataService {
  private readonly providers = [rawg];

  async search(title: string, platform: string, year?: number) {
    const results = await Promise.all(
      this.providers.map((p) => p.searchGame({ title, platform, year }))
    );
    return results.flat();
  }
}
