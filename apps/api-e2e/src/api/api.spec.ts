import axios from 'axios';
import { Client } from 'pg';

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

function readRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
}

function parseSslFlag(value: string | undefined): boolean {
  if (value === undefined || value.trim() === '') {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  throw new Error(
    `Invalid POSTGRES_SSL value "${value}". Expected true,false,1,0,yes,no,on,off.`,
  );
}

function createDatabaseClient(): Client {
  return new Client({
    host: readRequiredEnv('POSTGRES_HOST'),
    port: Number(readRequiredEnv('POSTGRES_PORT')),
    user: readRequiredEnv('POSTGRES_USER'),
    password: readRequiredEnv('POSTGRES_PASSWORD'),
    database: readRequiredEnv('POSTGRES_DB'),
    ssl: parseSslFlag(process.env.POSTGRES_SSL),
  });
}

describe('API DB foundation', () => {
  it('boots and serves API responses', async () => {
    const res = await axios.get(`/api/v1`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ message: 'Hello API' });
  });

  it('returns healthy DB readiness when database is reachable', async () => {
    const res = await axios.get('/api/v1/health/db');

    expect(res.status).toBe(200);
    expect(res.data).toEqual(
      expect.objectContaining({
        status: 'healthy',
      }),
    );
    expect(new Date(String(res.data.checkedAt)).toString()).not.toBe(
      'Invalid Date',
    );
  });

  it('reaches migration-backed schema', async () => {
    const client = createDatabaseClient();
    await client.connect();

    try {
      const migrationsTable = await client.query<{ table_name: string }>(
        `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'migrations'
        `,
      );
      expect(migrationsTable.rowCount).toBe(1);

      const usersTable = await client.query<{ table_name: string }>(
        `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'users'
        `,
      );
      expect(usersTable.rowCount).toBe(1);

      const requiredColumns = await client.query<{ column_name: string }>(
        `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'users'
            AND column_name = ANY($1::text[])
        `,
        [['id', 'email', 'display_name', 'created_at', 'updated_at']],
      );
      const actualColumns = requiredColumns.rows
        .map((row) => row.column_name)
        .sort();

      expect(actualColumns).toEqual([
        'created_at',
        'display_name',
        'email',
        'id',
        'updated_at',
      ]);

      const usersEmailUniqueConstraint = await client.query<{
        conname: string;
      }>(
        `
          SELECT conname
          FROM pg_constraint
          WHERE connamespace = 'public'::regnamespace
            AND conrelid = 'users'::regclass
            AND contype = 'u'
            AND conname = 'UQ_users_email'
        `,
      );
      expect(usersEmailUniqueConstraint.rowCount).toBe(1);

      const usersCreatedAtIndex = await client.query<{ indexname: string }>(
        `
          SELECT indexname
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename = 'users'
            AND indexname = 'idx_users_created_at'
        `,
      );
      expect(usersCreatedAtIndex.rowCount).toBe(1);
    } finally {
      await client.end();
    }
  });
});
