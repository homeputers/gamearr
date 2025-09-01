import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OrganizeController } from './organize.controller.js';
import { OrganizeService } from './organize.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [OrganizeController],
  providers: [OrganizeService],
})
export class OrganizeModule {}
