import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import pinoHttp from 'pino-http';
import type { Request, Response, NextFunction } from 'express';
import { mkdirSync } from 'node:fs';
import helmet from 'helmet';
import { config, logger, withCorrelationId } from '@gamearr/shared';

async function bootstrap() {
  // In ESM, static imports are hoisted and executed before this module body.
  // Use a dynamic import to ensure reflect-metadata is loaded before AppModule
  // and its decorators are evaluated.
  const { AppModule } = await import('./app.module');
  const app = await NestFactory.create(AppModule);

  mkdirSync(config.paths.datRoot, { recursive: true });
  logger.info({ datRoot: config.paths.datRoot }, 'using dat root');

  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  });

  const authToken = process.env.AUTH_TOKEN;
  if (authToken) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const requiresAuth =
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ||
        req.path.startsWith('/downloads');
      if (!requiresAuth) return next();
      const header = req.headers['authorization'];
      if (header === `Bearer ${authToken}`) return next();
      res.status(401).json({ message: 'Unauthorized' });
    });
  }


  // pino-http's type definitions lag behind the latest pino releases, so we
  // cast our shared logger to `any` to satisfy the expected interface.
  app.use(pinoHttp({ logger: logger as any }));

  app.use((req: Request, _res: Response, next: NextFunction) =>
    withCorrelationId(() => next(), (req as any).id),
  );
  await app.listen(3000);
}

bootstrap();
