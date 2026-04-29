import axios, { type AxiosResponse, type Method } from 'axios';
import { randomBytes, randomUUID, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { Client } from 'pg';
import type {
  AccessTokenResponse,
  ApiErrorCode,
  ApiErrorResponse,
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
  explicitEmail?: string;
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

function buildUsersUrl(
  query: Record<string, string | number> = {},
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();
  return queryString === '' ? '/api/v1/users' : `/api/v1/users?${queryString}`;
}

function expectApiErrorResponse(params: {
  response: AxiosResponse;
  statusCode: ApiErrorResponse['statusCode'];
  code: ApiErrorCode;
}): void {
  const { response, statusCode, code } = params;
  expect(response.status).toBe(statusCode);
  expect(response.data).toEqual(
    expect.objectContaining({
      statusCode,
      error: expect.objectContaining({
        code,
        message: expect.any(String),
      }),
    }),
  );
  expect(Object.keys(response.data).sort()).toEqual(['error', 'statusCode']);
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
    const email =
      input.explicitEmail ??
      `${testPrefix}-${randomBytes(6).toString('hex')}@example.com`;
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
    const response = await request('GET', buildUsersUrl());
    expectApiErrorResponse({
      response,
      statusCode: 401,
      code: 'AUTH_UNAUTHENTICATED',
    });
  });

  it('returns 401 for requests with invalid bearer token', async () => {
    const response = await request('GET', buildUsersUrl(), {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    expectApiErrorResponse({
      response,
      statusCode: 401,
      code: 'AUTH_INVALID_OR_EXPIRED_TOKEN',
    });
  });

  it('returns 403 for authenticated non-admin requests', async () => {
    const plainPassword = 'UsersRoutePassw0rd!';
    const user = await createUser({
      passwordHash: await hashPassword(plainPassword),
      role: 'user',
      displayName: 'Non Admin User',
    });
    const accessToken = await loginAndGetAccessToken(user.email, plainPassword);

    const response = await request('GET', buildUsersUrl(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expectApiErrorResponse({
      response,
      statusCode: 403,
      code: 'AUTH_FORBIDDEN',
    });
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

    const response = await request<UsersListResponse>('GET', buildUsersUrl(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual(
      expect.objectContaining({
        users: expect.any(Array),
        pagination: expect.objectContaining({
          page: 1,
          pageSize: 25,
          totalItems: expect.any(Number),
          totalPages: expect.any(Number),
          hasNextPage: expect.any(Boolean),
          hasPreviousPage: expect.any(Boolean),
          sortBy: 'createdAt',
          sortDir: 'desc',
        }),
      }),
    );
    expect(Object.keys(response.data).sort()).toEqual(['pagination', 'users']);

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

  it('returns 200 with pagination metadata and additive envelope fields', async () => {
    const adminPassword = 'EmptyDatasetUsersRoutePassw0rd!';
    const adminUser = await createUser({
      passwordHash: await hashPassword(adminPassword),
      role: 'admin',
      displayName: 'Empty Dataset Admin',
    });
    const accessToken = await loginAndGetAccessToken(adminUser.email, adminPassword);

    const response = await request<UsersListResponse>('GET', buildUsersUrl(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status).toBe(200);
    const returnedAdmin = response.data.users.find((user) => user.id === adminUser.id);
    expect(returnedAdmin).toBeDefined();

    const { pagination } = response.data;
    const expectedTotalPages =
      pagination.totalItems === 0
        ? 0
        : Math.ceil(pagination.totalItems / pagination.pageSize);
    expect(pagination).toEqual(
      expect.objectContaining({
        page: 1,
        pageSize: 25,
        totalItems: expect.any(Number),
        totalPages: expectedTotalPages,
        hasNextPage: pagination.page < expectedTotalPages,
        hasPreviousPage: false,
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
    );
  });

  it('returns 200 with empty users for syntactically valid out-of-range pages', async () => {
    const adminPassword = 'OutOfRangeUsersRoutePassw0rd!';
    const adminUser = await createUser({
      passwordHash: await hashPassword(adminPassword),
      role: 'admin',
      displayName: 'Out of Range Admin',
    });
    await createUser({
      passwordHash: await hashPassword('OutOfRangeListedUsersRoutePassw0rd!'),
      role: 'user',
      displayName: 'Out of Range Listed User',
    });
    const accessToken = await loginAndGetAccessToken(adminUser.email, adminPassword);

    const response = await request<UsersListResponse>(
      'GET',
      buildUsersUrl({ page: 999, pageSize: 25 }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.users).toEqual([]);
    const { pagination } = response.data;
    const expectedTotalPages =
      pagination.totalItems === 0
        ? 0
        : Math.ceil(pagination.totalItems / pagination.pageSize);
    expect(pagination).toEqual(
      expect.objectContaining({
        page: 999,
        pageSize: 25,
        totalItems: expect.any(Number),
        totalPages: expectedTotalPages,
        hasNextPage: false,
        hasPreviousPage: true,
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
    );
    expect(pagination.totalItems).toBeGreaterThanOrEqual(2);
  });

  it('supports max accepted pageSize', async () => {
    const adminPassword = 'MaxPageSizeUsersRoutePassw0rd!';
    const adminUser = await createUser({
      passwordHash: await hashPassword(adminPassword),
      role: 'admin',
      displayName: 'Max Page Size Admin',
    });
    const accessToken = await loginAndGetAccessToken(adminUser.email, adminPassword);

    const response = await request<UsersListResponse>(
      'GET',
      buildUsersUrl({ pageSize: 100 }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.pagination.pageSize).toBe(100);
    expect(response.data.users.length).toBeLessThanOrEqual(100);
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

    const response = await request<UsersListResponse>(
      'GET',
      buildUsersUrl({
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
      {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      },
    );

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

  it('returns users in deterministic order: createdAt ASC, id ASC tie-break', async () => {
    const adminPassword = 'OrderAscAdminUsersRoutePassw0rd!';
    const adminUser = await createUser({
      passwordHash: await hashPassword(adminPassword),
      role: 'admin',
      displayName: 'Ordering Asc Admin',
    });
    const tieTimestamp = new Date('2026-01-20T10:00:00.000Z');
    const oldestTimestamp = new Date('2026-01-10T10:00:00.000Z');
    const oldestUser = await createUser({
      explicitId: '00000000-0000-0000-0000-0000000000a2',
      passwordHash: null,
      role: 'user',
      displayName: 'Oldest User Asc',
      createdAt: oldestTimestamp,
    });
    const tieHigherIdUser = await createUser({
      explicitId: '00000000-0000-0000-0000-0000000000f2',
      passwordHash: null,
      role: 'user',
      displayName: 'Tie Higher Id User Asc',
      createdAt: tieTimestamp,
    });
    const tieLowerIdUser = await createUser({
      explicitId: '00000000-0000-0000-0000-0000000000b2',
      passwordHash: null,
      role: 'user',
      displayName: 'Tie Lower Id User Asc',
      createdAt: tieTimestamp,
    });
    const accessToken = await loginAndGetAccessToken(adminUser.email, adminPassword);

    const response = await request<UsersListResponse>(
      'GET',
      buildUsersUrl({
        sortBy: 'createdAt',
        sortDir: 'asc',
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    expect(response.status).toBe(200);

    const trackedEmails = new Set([
      oldestUser.email,
      tieLowerIdUser.email,
      tieHigherIdUser.email,
    ]);
    const trackedOrdering = response.data.users
      .filter((user) => trackedEmails.has(user.email))
      .map((user) => user.email);

    expect(trackedOrdering).toEqual([
      oldestUser.email,
      tieLowerIdUser.email,
      tieHigherIdUser.email,
    ]);
  });

  it('returns 400 REQUEST_VALIDATION_FAILED for invalid query values', async () => {
    const adminPassword = 'InvalidQueryUsersRoutePassw0rd!';
    const adminUser = await createUser({
      passwordHash: await hashPassword(adminPassword),
      role: 'admin',
      displayName: 'Invalid Query Admin',
    });
    const accessToken = await loginAndGetAccessToken(adminUser.email, adminPassword);

    const invalidPageResponse = await request(
      'GET',
      buildUsersUrl({ page: 0 }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    expectApiErrorResponse({
      response: invalidPageResponse,
      statusCode: 400,
      code: 'REQUEST_VALIDATION_FAILED',
    });

    const invalidSortDirResponse = await request(
      'GET',
      buildUsersUrl({ sortDir: 'descending' }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    expectApiErrorResponse({
      response: invalidSortDirResponse,
      statusCode: 400,
      code: 'REQUEST_VALIDATION_FAILED',
    });

    const invalidRoleResponse = await request(
      'GET',
      buildUsersUrl({ role: 'owner' }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    expectApiErrorResponse({
      response: invalidRoleResponse,
      statusCode: 400,
      code: 'REQUEST_VALIDATION_FAILED',
    });
  });

  it('returns 400 REQUEST_VALIDATION_FAILED for empty role/email filters', async () => {
    const adminPassword = 'EmptyFilterUsersRoutePassw0rd!';
    const adminUser = await createUser({
      passwordHash: await hashPassword(adminPassword),
      role: 'admin',
      displayName: 'Empty Filter Admin',
    });
    const accessToken = await loginAndGetAccessToken(adminUser.email, adminPassword);

    const emptyRoleResponse = await request(
      'GET',
      buildUsersUrl({ role: '' }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    expectApiErrorResponse({
      response: emptyRoleResponse,
      statusCode: 400,
      code: 'REQUEST_VALIDATION_FAILED',
    });

    const emptyEmailResponse = await request(
      'GET',
      buildUsersUrl({ email: '   ' }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    expectApiErrorResponse({
      response: emptyEmailResponse,
      statusCode: 400,
      code: 'REQUEST_VALIDATION_FAILED',
    });
  });

  it('filters by role with exact match semantics', async () => {
    const adminPassword = 'RoleFilterUsersRoutePassw0rd!';
    const adminUser = await createUser({
      passwordHash: await hashPassword(adminPassword),
      role: 'admin',
      displayName: 'Role Filter Admin',
    });
    const matchedUser = await createUser({
      passwordHash: null,
      role: 'user',
      displayName: 'Role Match User',
    });
    await createUser({
      passwordHash: null,
      role: 'admin',
      displayName: 'Role Non Match Admin',
    });
    const accessToken = await loginAndGetAccessToken(adminUser.email, adminPassword);

    const response = await request<UsersListResponse>(
      'GET',
      buildUsersUrl({ role: 'user' }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.pagination).toEqual(
      expect.objectContaining({
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
    );
    expect(response.data.users.every((user) => user.role === 'user')).toBe(true);
    expect(response.data.users.some((user) => user.id === matchedUser.id)).toBe(true);
    expect(response.data.users.some((user) => user.id === adminUser.id)).toBe(false);
  });

  it('filters by email with case-insensitive partial match semantics', async () => {
    const adminPassword = 'EmailFilterUsersRoutePassw0rd!';
    const adminUser = await createUser({
      passwordHash: await hashPassword(adminPassword),
      role: 'admin',
      displayName: 'Email Filter Admin',
    });
    const matchedUser = await createUser({
      passwordHash: null,
      role: 'user',
      displayName: 'Email Match User',
      explicitEmail: `${testPrefix}-Filter-Match-User@Example.COM`,
    });
    const nonMatchedUser = await createUser({
      passwordHash: null,
      role: 'user',
      displayName: 'Email Non Match User',
      explicitEmail: `${testPrefix}-not-related-user@example.com`,
    });
    const accessToken = await loginAndGetAccessToken(adminUser.email, adminPassword);

    const response = await request<UsersListResponse>(
      'GET',
      buildUsersUrl({ email: 'match-user@example' }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.users.some((user) => user.id === matchedUser.id)).toBe(true);
    expect(response.data.users.some((user) => user.id === nonMatchedUser.id)).toBe(false);
  });

  it('combines role and email filters with AND semantics', async () => {
    const adminPassword = 'CombinedFilterUsersRoutePassw0rd!';
    const adminUser = await createUser({
      passwordHash: await hashPassword(adminPassword),
      role: 'admin',
      displayName: 'Combined Filter Admin',
    });
    const matchingUser = await createUser({
      passwordHash: null,
      role: 'user',
      displayName: 'Combined Match User',
      explicitEmail: `${testPrefix}-combined-target@example.com`,
    });
    await createUser({
      passwordHash: null,
      role: 'admin',
      displayName: 'Combined Email Match Admin',
      explicitEmail: `${testPrefix}-combined-target-admin@example.com`,
    });
    await createUser({
      passwordHash: null,
      role: 'user',
      displayName: 'Combined Role Match User',
      explicitEmail: `${testPrefix}-other-user@example.com`,
    });
    const accessToken = await loginAndGetAccessToken(adminUser.email, adminPassword);

    const response = await request<UsersListResponse>(
      'GET',
      buildUsersUrl({ role: 'user', email: 'combined-target' }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.users).toEqual([
      expect.objectContaining({
        id: matchingUser.id,
        role: 'user',
      }),
    ]);
    expect(response.data.pagination).toEqual(
      expect.objectContaining({
        page: 1,
        pageSize: 25,
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
    );
  });

  it('returns 400 REQUEST_UNKNOWN_FIELD for unknown query params', async () => {
    const adminPassword = 'UnknownFieldUsersRoutePassw0rd!';
    const adminUser = await createUser({
      passwordHash: await hashPassword(adminPassword),
      role: 'admin',
      displayName: 'Unknown Field Admin',
    });
    const accessToken = await loginAndGetAccessToken(adminUser.email, adminPassword);

    const response = await request(
      'GET',
      buildUsersUrl({ displayName: 'admin' }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    expectApiErrorResponse({
      response,
      statusCode: 400,
      code: 'REQUEST_UNKNOWN_FIELD',
    });
  });
});
