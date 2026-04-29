import axios, { type AxiosResponse } from 'axios';
import type { ApiErrorCode, ApiErrorResponse } from '@fullstack-starter/contracts';
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

function expectApiErrorResponse(params: {
  response: AxiosResponse;
  statusCode: ApiErrorResponse['statusCode'];
  code: ApiErrorCode;
}) {
  const { response, statusCode, code } = params;
  expect(response.status).toBe(statusCode);
  expect(response.data).toEqual({
    statusCode,
    error: {
      code,
      message: expect.any(String),
    },
  });
  expect(Object.keys(response.data).sort()).toEqual(['error', 'statusCode']);
  expect(response.data.error).not.toHaveProperty('details');
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

  it('returns stable 404 envelope for unknown api routes', async () => {
    const response = await axios.get('/api/v1/route-that-does-not-exist', {
      validateStatus: () => true,
    });

    expectApiErrorResponse({
      response,
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND',
    });
    expect(response.data.error.message).toBe('Resource not found.');
  });

  it('reaches migration-backed schema', async () => {
    const client = createDatabaseClient();
    await client.connect();

    try {
      const requiredMigrationNames = [
        'CreateUsersTable1713528000000',
        'AddAuthFoundation1777036800000',
        'AddUserRoleBaseline1777123200000',
      ];

      const migrationsTable = await client.query<{ table_name: string }>(
        `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'migrations'
        `,
      );
      expect(migrationsTable.rowCount).toBe(1);

      const requiredMigrations = await client.query<{ name: string }>(
        `
          SELECT "name"
          FROM "migrations"
          WHERE "name" = ANY($1::text[])
        `,
        [requiredMigrationNames],
      );
      const appliedRequiredMigrations = requiredMigrations.rows
        .map((row) => row.name)
        .sort();
      expect(appliedRequiredMigrations).toEqual([...requiredMigrationNames].sort());

      const usersTable = await client.query<{ table_name: string }>(
        `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'users'
        `,
      );
      expect(usersTable.rowCount).toBe(1);

      const usersColumns = await client.query<{ column_name: string }>(
        `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'users'
            AND column_name = ANY($1::text[])
        `,
        [
          [
            'id',
            'email',
            'display_name',
            'password_hash',
            'role',
            'created_at',
            'updated_at',
          ],
        ],
      );
      const actualUsersColumns = usersColumns.rows
        .map((row) => row.column_name)
        .sort();
      expect(actualUsersColumns).toEqual([
        'created_at',
        'display_name',
        'email',
        'id',
        'password_hash',
        'role',
        'updated_at',
      ]);

      const usersRoleColumn = await client.query<{
        is_nullable: 'YES' | 'NO';
        column_default: string | null;
      }>(
        `
          SELECT is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'users'
            AND column_name = 'role'
        `,
      );
      expect(usersRoleColumn.rowCount).toBe(1);
      expect(usersRoleColumn.rows[0].is_nullable).toBe('NO');
      expect(usersRoleColumn.rows[0].column_default).toContain("'user'");

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

      const usersCheckConstraints = await client.query<{ conname: string }>(
        `
          SELECT conname
          FROM pg_constraint
          WHERE connamespace = 'public'::regnamespace
            AND conrelid = 'users'::regclass
            AND contype = 'c'
            AND conname = ANY($1::text[])
        `,
        [['CHK_users_password_hash_not_blank', 'CHK_users_role_allowed']],
      );
      const actualUsersCheckConstraints = usersCheckConstraints.rows
        .map((row) => row.conname)
        .sort();
      expect(actualUsersCheckConstraints).toEqual([
        'CHK_users_password_hash_not_blank',
        'CHK_users_role_allowed',
      ]);

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

      const authSessionsTable = await client.query<{ table_name: string }>(
        `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'auth_sessions'
        `,
      );
      expect(authSessionsTable.rowCount).toBe(1);

      const authSessionsColumns = await client.query<{ column_name: string }>(
        `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'auth_sessions'
            AND column_name = ANY($1::text[])
        `,
        [
          [
            'id',
            'user_id',
            'refresh_token_hash',
            'expires_at',
            'revoked_at',
            'created_at',
            'updated_at',
          ],
        ],
      );
      const actualAuthSessionsColumns = authSessionsColumns.rows
        .map((row) => row.column_name)
        .sort();
      expect(actualAuthSessionsColumns).toEqual([
        'created_at',
        'expires_at',
        'id',
        'refresh_token_hash',
        'revoked_at',
        'updated_at',
        'user_id',
      ]);

      const authSessionsUniqueConstraints = await client.query<{
        conname: string;
      }>(
        `
          SELECT conname
          FROM pg_constraint
          WHERE connamespace = 'public'::regnamespace
            AND conrelid = 'auth_sessions'::regclass
            AND contype = 'u'
            AND conname = ANY($1::text[])
        `,
        [['UQ_auth_sessions_user_id', 'UQ_auth_sessions_refresh_token_hash']],
      );
      const actualAuthSessionsUniqueConstraints = authSessionsUniqueConstraints.rows
        .map((row) => row.conname)
        .sort();
      expect(actualAuthSessionsUniqueConstraints).toEqual([
        'UQ_auth_sessions_refresh_token_hash',
        'UQ_auth_sessions_user_id',
      ]);

      const authSessionsCheckConstraints = await client.query<{ conname: string }>(
        `
          SELECT conname
          FROM pg_constraint
          WHERE connamespace = 'public'::regnamespace
            AND conrelid = 'auth_sessions'::regclass
            AND contype = 'c'
            AND conname = ANY($1::text[])
        `,
        [
          [
            'CHK_auth_sessions_refresh_token_hash_not_blank',
            'CHK_auth_sessions_expiry_after_creation',
            'CHK_auth_sessions_revoked_at_after_creation',
          ],
        ],
      );
      const actualAuthSessionsCheckConstraints = authSessionsCheckConstraints.rows
        .map((row) => row.conname)
        .sort();
      expect(actualAuthSessionsCheckConstraints).toEqual([
        'CHK_auth_sessions_expiry_after_creation',
        'CHK_auth_sessions_refresh_token_hash_not_blank',
        'CHK_auth_sessions_revoked_at_after_creation',
      ]);

      const authSessionsIndexes = await client.query<{ indexname: string }>(
        `
          SELECT indexname
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename = 'auth_sessions'
            AND indexname = ANY($1::text[])
        `,
        [['idx_auth_sessions_expires_at', 'idx_auth_sessions_revoked_at']],
      );
      const actualAuthSessionsIndexes = authSessionsIndexes.rows
        .map((row) => row.indexname)
        .sort();
      expect(actualAuthSessionsIndexes).toEqual([
        'idx_auth_sessions_expires_at',
        'idx_auth_sessions_revoked_at',
      ]);

      const authSessionsUserForeignKey = await client.query<{
        definition: string;
      }>(
        `
          SELECT pg_get_constraintdef(oid) AS definition
          FROM pg_constraint
          WHERE connamespace = 'public'::regnamespace
            AND conrelid = 'auth_sessions'::regclass
            AND contype = 'f'
            AND conname = 'FK_auth_sessions_user_id'
        `,
      );
      expect(authSessionsUserForeignKey.rowCount).toBe(1);
      expect(authSessionsUserForeignKey.rows[0].definition).toContain(
        'REFERENCES users(id)',
      );
      expect(authSessionsUserForeignKey.rows[0].definition).toContain(
        'ON DELETE CASCADE',
      );
    } finally {
      await client.end();
    }
  });
});
