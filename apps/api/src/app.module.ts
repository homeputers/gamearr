import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { LibraryModule } from './library/library.module';
import { MetadataModule } from './metadata/metadata.module';
import { MatchModule } from './match/match.module';
import { ImportsModule } from './imports/imports.module';
import { DownloadsModule } from './downloads/downloads.module';
import { ExportsModule } from './exports/exports.module';
import { PlatformModule } from './platform/platform.module';
import { GameModule } from './game/game.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { ProvidersModule } from './providers/providers.module.js';
import { MetricsModule } from './metrics/metrics.module.js';
import { SupportModule } from './support/support.module.js';
import { SearchModule } from './search/search.module.js';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    HealthModule,
    LibraryModule,
    MetadataModule,
    MatchModule,
    ImportsModule,
    DownloadsModule,
    ExportsModule,
    PlatformModule,
    GameModule,
    SettingsModule,
    ProvidersModule,
    MetricsModule,
    SupportModule,
    SearchModule,
  ],
})
export class AppModule {}
