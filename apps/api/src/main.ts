import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import pinoHttp from 'pino-http';
import { logger, withRequestId } from '@gamearr/shared';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(pinoHttp({ logger }));
  app.use((req, _res, next) => withRequestId(() => next(), (req as any).id));
  await app.listen(3000);
}

bootstrap();
