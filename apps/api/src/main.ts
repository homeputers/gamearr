import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import pinoHttp from 'pino-http';
import type { Request, Response, NextFunction } from 'express';
import { logger, withRequestId } from '@gamearr/shared';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // pino-http's type definitions lag behind the latest pino releases, so we
  // cast our shared logger to `any` to satisfy the expected interface.
  app.use(pinoHttp({ logger: logger as any }));

  app.use((req: Request, _res: Response, next: NextFunction) =>
    withRequestId(() => next(), (req as any).id),
  );
  await app.listen(3000);
}

bootstrap();
