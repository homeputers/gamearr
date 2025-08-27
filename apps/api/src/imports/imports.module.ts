import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ImportsController } from './imports.controller.js';
import { ImportsService, PRISMA_CLIENT } from './imports.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ImportsController],
  providers: [
    ImportsService,
    {
      provide: PRISMA_CLIENT,
      useExisting: PrismaClient
    }
  ],
})
export class ImportsModule {}
