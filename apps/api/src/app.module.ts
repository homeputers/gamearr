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
  ],
})
export class AppModule {}
