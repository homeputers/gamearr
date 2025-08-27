import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { LibraryModule } from './library/library.module';
import { MetadataModule } from './metadata/metadata.module';
import { MatchModule } from './match/match.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    HealthModule,
    LibraryModule,
    MetadataModule,
    MatchModule,
  ],
})
export class AppModule {}
