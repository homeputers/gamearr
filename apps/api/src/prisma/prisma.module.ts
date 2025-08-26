import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import prisma from '@gamearr/storage/src/client';

@Module({
  providers: [{ provide: PrismaClient, useValue: prisma }],
  exports: [PrismaClient],
})
export class PrismaModule {}
