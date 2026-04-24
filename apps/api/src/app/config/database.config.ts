import { registerAs } from '@nestjs/config';

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  db: string;
  ssl: boolean;
}

export function parseSslFlag(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  throw new Error(
    `Invalid POSTGRES_SSL value "${value}". Use one of: true,false,1,0,yes,no,on,off.`,
  );
}

export function buildDatabaseConfig(env: NodeJS.ProcessEnv): DatabaseConfig {
  return {
    host: env.POSTGRES_HOST ?? '',
    port: Number(env.POSTGRES_PORT ?? Number.NaN),
    user: env.POSTGRES_USER ?? '',
    password: env.POSTGRES_PASSWORD ?? '',
    db: env.POSTGRES_DB ?? '',
    ssl: parseSslFlag(env.POSTGRES_SSL, false),
  };
}

export const databaseConfig = registerAs('database', (): DatabaseConfig =>
  buildDatabaseConfig(process.env),
);
