import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './system/app.controller';
import { AppService } from './system/app.service';
import { AuthModule } from './features/auth/auth.module';
import { authConfig } from './config/auth.config';
import { corsConfig } from './config/cors.config';
import { type DatabaseConfig, databaseConfig } from './config/database.config';
import { validateEnvironment } from './config/env.validation';
import { buildTypeOrmModuleOptions } from '../db/typeorm.options';
import { DatabaseReadinessService } from './system/database-readiness.service';
import { UsersModule } from './features/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env', '.env.docker'],
      load: [databaseConfig, authConfig, corsConfig],
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (dbConfig: DatabaseConfig) =>
        buildTypeOrmModuleOptions(dbConfig),
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseReadinessService],
})
export class AppModule {}
