import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { IndexersService } from './indexers.service.js';
import { IndexersController } from './indexers.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [IndexersController],
  providers: [IndexersService],
})
export class IndexersModule {}

