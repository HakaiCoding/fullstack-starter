import axios, { type AxiosResponse, type Method } from 'axios';
import { randomBytes, randomUUID, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { Client } from 'pg';
import type {
  AccessTokenResponse,
  AuthRole,
  UsersListResponse,
} from '@fullstack-starter/contracts';

const scryptAsync = promisify(scrypt);
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);
const PASSWORD_HASH_ALGORITHM = 'scrypt';
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_BYTES = 16;

interface CreateUserInput {
  passwordHash: string | null;
  role: AuthRole;
  displayName: string | null;
  createdAt?: Date;
  explicitId?: string;
}

interface CreatedUser {
  id: string;
  email: string;
  displayName: string | null;
  role: AuthRole;
}

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

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString('hex');
  const derivedKey = await scryptAsync(password, salt, PASSWORD_KEY_LENGTH);
  return `${PASSWORD_HASH_ALGORITHM}$${salt}$${(derivedKey as Buffer).toString('hex')}`;
}

async function request<T>(
  method: Method,
  url: string,
  options: {
    data?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<AxiosResponse<T>> {
  return axios.request<T>({
    method,
    url,
    data: options.data,
    headers: options.headers,
    validateStatus: () => true,
  });
}

describe('Users RBAC e2e', () => {
  const createdUserIds: string[] = [];
  const testPrefix = `users-e2e-${Date.now()}`;
  let dbClient: Client;

  beforeAll(async () => {
    dbClient = createDatabaseClient();
    await dbClient.connect();
  });

  afterEach(async () => {
    if (createdUserIds.length === 0) {
      return;
    }

    const idsToDelete = [...createdUserIds];
    createdUserIds.length = 0;
    await dbClient.query('DELETE FROM "users" WHERE id = ANY($1::uuid[])', [
      idsToDelete,
    ]);
  });

  afterAll(async () => {
    await dbClient.end();
  });

  async function createUser(input: CreateUserInput): Promise<CreatedUser> {
    const id = input.explicitId ?? randomUUID();
    const email = `${testPrefix}-${randomBytes(6).toString('hex')}@example.com`;
    const createdAt = input.createdAt ?? new Date();
    const inserted = await dbClient.query<CreatedUser>(
      `
        INSERT INTO "users" (
          "id",
          "email",
          "display_name",
          "password_hash",
          "role",
          "created_at",
          "updated_at"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $6)
        RETURNING
          "id",
          "email",
          "display_name" AS "displayName",
          "role"
      `,
      [id, email, input.displayName, input.passwordHash, input.role, createdAt],
    );

    const user = inserted.rows[0];
    createdUserIds.push(user.id);
    return user;
  }

  async function loginAndGetAccessToken(
    email: string,
    password: string,
  ): Promise<string> {
    const loginResponse = await request<AccessTokenResponse>(
      'POST',
      '/api/v1/auth/login',
      {
        data: {
          email,
          password,
        },
      },
    );
    expect(loginResponse.status).toBe(201);
    return loginResponse.data.accessToken;
  }

  it('returns 401 for unauthenticated requests', async () => {
    const response = await request('GET', '/api/v1/users');
    expect(response.status).toBe(401);
  });

  it('returns 403 for authenticated non-admin requests', async () => {
    const plainPassword = 'UsersRoutePassw0rd!';
    const user = await createUser({
      passwordHash: await hashPassword(plainPassword),
      role: 'user',
      displayName: 'Non Admin User',
    });
    const accessToken = await loginAndGetAccessToken(user.email, plainPassword);

    const response = await request('GET', '/api/v1/users', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status).toBe(403);
  });

  it('returns 200 for admin with expected payload shape and no sensitive fields', async () => {
    const adminPassword = 'AdminUsersRoutePassw0rd!';
    const adminUser = await createUser({
      passwordHash: await hashPassword(adminPassword),
      role: 'admin',
      displayName: 'Admin User',
    });
    const listedUser = await createUser({
      passwordHash: await hashPassword('ListedUsersRoutePassw0rd!'),
      role: 'user',
      displayName: 'Listed User',
    });
    const accessToken = await loginAndGetAccessToken(adminUser.email, adminPassword);

    const response = await request<UsersListResponse>('GET', '/api/v1/users', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual(
      expect.objectContaining({
        users: expect.any(Array),
      }),
    );

    const returnedUser = response.data.users.find((user) => user.id === listedUser.id);
    expect(returnedUser).toBeDefined();
    expect(returnedUser).toEqual({
      id: listedUser.id,
      email: listedUser.email,
      displayName: listedUser.displayName,
      role: listedUser.role,
    });
    expect(Object.keys(returnedUser ?? {}).sort()).toEqual([
      'displayName',
      'email',
      'id',
      'role',
    ]);
    expect(returnedUser).not.toHaveProperty('passwordHash');
    expect(returnedUser).not.toHaveProperty('password_hash');
  });

  it('returns users in deterministic order: createdAt DESC, id ASC tie-break', async () => {
    const adminPassword = 'OrderAdminUsersRoutePassw0rd!';
    const adminUser = await createUser({
      passwordHash: await hashPassword(adminPassword),
      role: 'admin',
      displayName: 'Ordering Admin',
    });
    const tieTimestamp = new Date('2026-01-20T10:00:00.000Z');
    const oldestTimestamp = new Date('2026-01-10T10:00:00.000Z');
    const oldestUser = await createUser({
      explicitId: '00000000-0000-0000-0000-0000000000a1',
      passwordHash: null,
      role: 'user',
      displayName: 'Oldest User',
      createdAt: oldestTimestamp,
    });
    const tieHigherIdUser = await createUser({
      explicitId: '00000000-0000-0000-0000-0000000000f1',
      passwordHash: null,
      role: 'user',
      displayName: 'Tie Higher Id User',
      createdAt: tieTimestamp,
    });
    const tieLowerIdUser = await createUser({
      explicitId: '00000000-0000-0000-0000-0000000000b1',
      passwordHash: null,
      role: 'user',
      displayName: 'Tie Lower Id User',
      createdAt: tieTimestamp,
    });
    const accessToken = await loginAndGetAccessToken(adminUser.email, adminPassword);

    const response = await request<UsersListResponse>('GET', '/api/v1/users', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status).toBe(200);

    const trackedEmails = new Set([
      tieLowerIdUser.email,
      tieHigherIdUser.email,
      oldestUser.email,
    ]);
    const trackedOrdering = response.data.users
      .filter((user) => trackedEmails.has(user.email))
      .map((user) => user.email);

    expect(trackedOrdering).toEqual([
      tieLowerIdUser.email,
      tieHigherIdUser.email,
      oldestUser.email,
    ]);
  });
});
