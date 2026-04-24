import { DataSource } from 'typeorm';
import { buildDatabaseConfig } from '../app/config/database.config';
import { validateEnvironment } from '../app/config/env.validation';
import { buildDataSourceOptions } from './typeorm.options';

const validatedEnvironment = validateEnvironment(
  process.env as Record<string, unknown>,
);
const databaseConfig = buildDatabaseConfig({
  POSTGRES_HOST: String(validatedEnvironment.POSTGRES_HOST),
  POSTGRES_PORT: String(validatedEnvironment.POSTGRES_PORT),
  POSTGRES_DB: String(validatedEnvironment.POSTGRES_DB),
  POSTGRES_USER: String(validatedEnvironment.POSTGRES_USER),
  POSTGRES_PASSWORD: String(validatedEnvironment.POSTGRES_PASSWORD),
  POSTGRES_SSL:
    validatedEnvironment.POSTGRES_SSL === undefined
      ? undefined
      : String(validatedEnvironment.POSTGRES_SSL),
});

const AppDataSource = new DataSource(
  buildDataSourceOptions(databaseConfig, {
    useTsMigrations: true,
  }),
);

export default AppDataSource;
