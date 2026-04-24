import { type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { type DataSourceOptions } from 'typeorm';
import { type PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { type DatabaseConfig } from '../app/config/database.config';
import { UserEntity } from './entities/user.entity';
import { snakeNamingStrategy } from './snake-naming.strategy';

const DATA_SOURCE_MIGRATIONS_GLOB = [
  'apps/api/src/db/migrations/*.ts',
  'apps/api/src/db/migrations/*.js',
  'dist/apps/api/db/migrations/*.js',
];
const RUNTIME_MIGRATIONS_GLOB = ['dist/apps/api/db/migrations/*.js'];
const ENTITIES = [UserEntity];

interface BuildDataSourceOptionsParams {
  useTsMigrations?: boolean;
}

function getSslOptions(
  sslEnabled: boolean,
): PostgresConnectionOptions['ssl'] {
  return sslEnabled ? { rejectUnauthorized: true } : false;
}

export function buildDataSourceOptions(
  databaseConfig: DatabaseConfig,
  params: BuildDataSourceOptionsParams = {},
): DataSourceOptions {
  const migrations = params.useTsMigrations
    ? DATA_SOURCE_MIGRATIONS_GLOB
    : RUNTIME_MIGRATIONS_GLOB;

  return {
    type: 'postgres',
    host: databaseConfig.host,
    port: databaseConfig.port,
    username: databaseConfig.user,
    password: databaseConfig.password,
    database: databaseConfig.db,
    ssl: getSslOptions(databaseConfig.ssl),
    namingStrategy: snakeNamingStrategy,
    synchronize: false,
    migrationsRun: false,
    entities: ENTITIES,
    migrations,
    // Pool and session options for a small starter footprint.
    poolSize: 10,
    extra: {
      options: '-c timezone=UTC',
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    },
  };
}

export function buildTypeOrmModuleOptions(
  databaseConfig: DatabaseConfig,
): TypeOrmModuleOptions {
  return {
    ...buildDataSourceOptions(databaseConfig, {
      useTsMigrations: false,
    }),
    autoLoadEntities: false,
    retryAttempts: 3,
    retryDelay: 1000,
  };
}
