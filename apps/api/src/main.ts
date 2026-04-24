/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { type CorsConfig } from './app/config/cors.config';
import { type DatabaseConfig } from './app/config/database.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const corsConfiguration = configService.getOrThrow<CorsConfig>('cors');
  const dbConfig = configService.getOrThrow<DatabaseConfig>('database');
  const allowedOrigins = new Set(corsConfiguration.allowedOrigins);

  app.enableCors({
    credentials: corsConfiguration.credentials,
    origin: (
      requestOrigin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      // Allow non-browser calls that do not include an Origin header.
      if (requestOrigin === undefined) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(requestOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS policy.'), false);
    },
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `Application is running on: http://localhost:${port}/${globalPrefix}/v1`,
  );
  Logger.log(
    `Database config loaded: ${dbConfig.host}:${dbConfig.port}/${dbConfig.db} (ssl=${dbConfig.ssl})`,
  );
}

bootstrap();
