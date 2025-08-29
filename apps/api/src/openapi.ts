import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { Module } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { HealthModule } from './health/health.module.js';
import { SupportModule } from './support/support.module.js';

class PrismaServiceMock {
  async onModuleInit() {}
  async onModuleDestroy() {}
}

@Module({
  imports: [AppModule],
  providers: [{ provide: PrismaService, useClass: PrismaServiceMock }],
})
class OpenApiModule {}

async function generate() {
  const app = await NestFactory.create(OpenApiModule);
  const config = new DocumentBuilder()
    .setTitle('Gamearr API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    include: [HealthModule, SupportModule],
  });
  const outputPath = resolve(process.cwd(), '../../docs/openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  await app.close();
}

generate();
