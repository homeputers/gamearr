import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { LibraryModule } from './library/library.module';

@Module({
  imports: [ConfigModule, PrismaModule, HealthModule, LibraryModule],
})
export class AppModule {}
