import axios, { type AxiosResponse, type Method } from 'axios';
import { createHmac, randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { Client } from 'pg';
import type {
  AccessTokenResponse,
  ApiErrorCode,
  ApiErrorResponse,
  AuthMeResponse,
  AuthRole,
  LogoutResponse,
} from '@fullstack-starter/contracts';

const scryptAsync = promisify(scrypt);
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);
const PASSWORD_HASH_ALGORITHM = 'scrypt';
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_BYTES = 16;

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

function hashRefreshToken(refreshToken: string): string {
  return createHmac('sha256', readRequiredEnv('AUTH_REFRESH_TOKEN_SECRET'))
    .update(refreshToken)
    .digest('hex');
}

function getSetCookieHeaders(response: AxiosResponse): string[] {
  const setCookie = response.headers['set-cookie'];
  if (!setCookie) {
    return [];
  }

  return Array.isArray(setCookie) ? setCookie : [setCookie];
}

function getCookieValueFromSetCookie(
  setCookieHeaders: string[],
  cookieName: string,
): string | null {
  for (const header of setCookieHeaders) {
    const [cookiePair] = header.split(';');
    const [name, ...valueParts] = cookiePair.split('=');
    if (name === cookieName) {
      return valueParts.join('=');
    }
  }

  return null;
}

function buildCookieHeader(cookieName: string, cookieValue: string): string {
  return `${cookieName}=${cookieValue}`;
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

function expectApiErrorResponse(params: {
  response: AxiosResponse;
  statusCode: ApiErrorResponse['statusCode'];
  code: ApiErrorCode;
  expectDetails?: boolean;
}): void {
  const { response, statusCode, code, expectDetails = false } = params;
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
  expect(
    Object.keys(response.data.error).every((key) =>
      ['code', 'details', 'message'].includes(key),
    ),
  ).toBe(true);

  if (expectDetails) {
    expect(Array.isArray(response.data.error.details)).toBe(true);
    expect((response.data.error.details as unknown[]).length).toBeGreaterThan(0);
    return;
  }

  expect(response.data.error.details).toBeUndefined();
}

describe('Auth flow e2e', () => {
  const refreshCookieName = readRequiredEnv('AUTH_REFRESH_COOKIE_NAME');
  const createdUserIds: string[] = [];
  const testPrefix = `auth-e2e-${Date.now()}`;
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

  async function createUser(password: string): Promise<{
    id: string;
    email: string;
  }> {
    const email = `${testPrefix}-${randomBytes(6).toString('hex')}@example.com`;
    const passwordHash = await hashPassword(password);
    const created = await dbClient.query<{ id: string; email: string }>(
      `
        INSERT INTO "users" ("email", "display_name", "password_hash")
        VALUES ($1, $2, $3)
        RETURNING "id", "email"
      `,
      [email, 'Auth E2E User', passwordHash],
    );

    const user = created.rows[0];
    createdUserIds.push(user.id);
    return user;
  }

  async function updateUserRole(userId: string, role: AuthRole): Promise<void> {
    await dbClient.query(
      `
        UPDATE "users"
        SET "role" = $2
        WHERE "id" = $1
      `,
      [userId, role],
    );
  }

  it('login success and login failure', async () => {
    const plainPassword = 'S3curePassw0rd!';
    const user = await createUser(plainPassword);

    const success = await request<AccessTokenResponse>('POST', '/api/v1/auth/login', {
      data: {
        email: user.email,
        password: plainPassword,
      },
    });

    expect(success.status).toBe(201);
    expect(success.data).toEqual({
      accessToken: expect.any(String),
    });
    const successSetCookie = getSetCookieHeaders(success);
    expect(successSetCookie.length).toBeGreaterThan(0);
    const refreshCookieValue = getCookieValueFromSetCookie(
      successSetCookie,
      refreshCookieName,
    );
    expect(refreshCookieValue).toEqual(expect.any(String));
    expect(successSetCookie.join(';')).toContain('HttpOnly');

    const failure = await request('POST', '/api/v1/auth/login', {
      data: {
        email: user.email,
        password: 'wrong-password',
      },
    });

    expectApiErrorResponse({
      response: failure,
      statusCode: 401,
      code: 'AUTH_INVALID_CREDENTIALS',
    });
  });

  it('returns 400 for login payload missing password', async () => {
    const response = await request('POST', '/api/v1/auth/login', {
      data: {
        email: 'missing-password@example.com',
      },
    });

    expectApiErrorResponse({
      response,
      statusCode: 400,
      code: 'REQUEST_VALIDATION_FAILED',
      expectDetails: true,
    });
  });

  it('returns 400 for login payload missing email', async () => {
    const response = await request('POST', '/api/v1/auth/login', {
      data: {
        password: 'S3curePassw0rd!',
      },
    });

    expectApiErrorResponse({
      response,
      statusCode: 400,
      code: 'REQUEST_VALIDATION_FAILED',
      expectDetails: true,
    });
  });

  it('returns 400 for login payload with non-string email', async () => {
    const response = await request('POST', '/api/v1/auth/login', {
      data: {
        email: 123,
        password: 'S3curePassw0rd!',
      },
    });

    expectApiErrorResponse({
      response,
      statusCode: 400,
      code: 'REQUEST_VALIDATION_FAILED',
      expectDetails: true,
    });
  });

  it('returns 400 for login payload with non-string password', async () => {
    const response = await request('POST', '/api/v1/auth/login', {
      data: {
        email: 'non-string-password@example.com',
        password: 123,
      },
    });

    expectApiErrorResponse({
      response,
      statusCode: 400,
      code: 'REQUEST_VALIDATION_FAILED',
      expectDetails: true,
    });
  });

  it('returns 400 for login payload with blank email', async () => {
    const response = await request('POST', '/api/v1/auth/login', {
      data: {
        email: '   ',
        password: 'S3curePassw0rd!',
      },
    });

    expectApiErrorResponse({
      response,
      statusCode: 400,
      code: 'REQUEST_VALIDATION_FAILED',
      expectDetails: true,
    });
  });

  it('returns 400 for login payload with blank password', async () => {
    const response = await request('POST', '/api/v1/auth/login', {
      data: {
        email: 'blank-password@example.com',
        password: '   ',
      },
    });

    expectApiErrorResponse({
      response,
      statusCode: 400,
      code: 'REQUEST_VALIDATION_FAILED',
      expectDetails: true,
    });
  });

  it('returns 400 for login payload with unknown extra field', async () => {
    const response = await request('POST', '/api/v1/auth/login', {
      data: {
        email: 'extra-field@example.com',
        password: 'S3curePassw0rd!',
        extra: 'unexpected',
      },
    });

    expectApiErrorResponse({
      response,
      statusCode: 400,
      code: 'REQUEST_UNKNOWN_FIELD',
      expectDetails: true,
    });
  });

  it('returns 400 for malformed syntactic json on login', async () => {
    const response = await request('POST', '/api/v1/auth/login', {
      data: '{"email":"broken@example.com","password":"S3curePassw0rd!"',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expectApiErrorResponse({
      response,
      statusCode: 400,
      code: 'REQUEST_MALFORMED_JSON',
    });
  });

  it('returns 401 for refresh request without refresh cookie', async () => {
    const response = await request('POST', '/api/v1/auth/refresh');

    expectApiErrorResponse({
      response,
      statusCode: 401,
      code: 'AUTH_UNAUTHENTICATED',
    });
  });

  it('refresh succeeds, rotates token, and rejects old refresh token', async () => {
    const plainPassword = 'RefreshPassw0rd!';
    const user = await createUser(plainPassword);

    const login = await request<AccessTokenResponse>('POST', '/api/v1/auth/login', {
      data: {
        email: user.email,
        password: plainPassword,
      },
    });
    expect(login.status).toBe(201);

    const initialRefreshToken = getCookieValueFromSetCookie(
      getSetCookieHeaders(login),
      refreshCookieName,
    );
    expect(initialRefreshToken).toEqual(expect.any(String));

    const firstRefresh = await request<AccessTokenResponse>(
      'POST',
      '/api/v1/auth/refresh',
      {
        headers: {
          Cookie: buildCookieHeader(refreshCookieName, String(initialRefreshToken)),
        },
      },
    );
    expect(firstRefresh.status).toBe(201);

    const rotatedRefreshToken = getCookieValueFromSetCookie(
      getSetCookieHeaders(firstRefresh),
      refreshCookieName,
    );
    expect(rotatedRefreshToken).toEqual(expect.any(String));
    expect(rotatedRefreshToken).not.toBe(initialRefreshToken);

    const session = await dbClient.query<{ refresh_token_hash: string }>(
      `
        SELECT "refresh_token_hash"
        FROM "auth_sessions"
        WHERE "user_id" = $1
      `,
      [user.id],
    );
    expect(session.rowCount).toBe(1);
    expect(session.rows[0].refresh_token_hash).toBe(
      hashRefreshToken(String(rotatedRefreshToken)),
    );

    const oldRefreshAttempt = await request('POST', '/api/v1/auth/refresh', {
      headers: {
        Cookie: buildCookieHeader(refreshCookieName, String(initialRefreshToken)),
      },
    });
    expectApiErrorResponse({
      response: oldRefreshAttempt,
      statusCode: 401,
      code: 'AUTH_INVALID_OR_EXPIRED_TOKEN',
    });
  });

  it('protects /auth/me and allows access with valid bearer token', async () => {
    const plainPassword = 'AccessPassw0rd!';
    const user = await createUser(plainPassword);

    const denied = await request('GET', '/api/v1/auth/me');
    expectApiErrorResponse({
      response: denied,
      statusCode: 401,
      code: 'AUTH_UNAUTHENTICATED',
    });

    const invalidTokenDenied = await request('GET', '/api/v1/auth/me', {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });
    expectApiErrorResponse({
      response: invalidTokenDenied,
      statusCode: 401,
      code: 'AUTH_INVALID_OR_EXPIRED_TOKEN',
    });

    const login = await request<AccessTokenResponse>('POST', '/api/v1/auth/login', {
      data: {
        email: user.email,
        password: plainPassword,
      },
    });
    expect(login.status).toBe(201);

    const refreshCookieOnly = getCookieValueFromSetCookie(
      getSetCookieHeaders(login),
      refreshCookieName,
    );
    expect(refreshCookieOnly).toEqual(expect.any(String));

    const refreshCookieOnlyDenied = await request('GET', '/api/v1/auth/me', {
      headers: {
        Cookie: buildCookieHeader(refreshCookieName, String(refreshCookieOnly)),
      },
    });
    expectApiErrorResponse({
      response: refreshCookieOnlyDenied,
      statusCode: 401,
      code: 'AUTH_UNAUTHENTICATED',
    });

    const allowed = await request<AuthMeResponse>('GET', '/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${login.data.accessToken}`,
      },
    });
    expect(allowed.status).toBe(200);
    expect(allowed.data).toEqual({
      id: user.id,
      email: user.email,
      displayName: 'Auth E2E User',
      role: 'user',
    });
  });

  it('applies role changes on refresh while existing access token stays valid until expiry', async () => {
    const plainPassword = 'RoleChangePassw0rd!';
    const user = await createUser(plainPassword);

    const login = await request<AccessTokenResponse>('POST', '/api/v1/auth/login', {
      data: {
        email: user.email,
        password: plainPassword,
      },
    });
    expect(login.status).toBe(201);

    const originalAccessToken = login.data.accessToken;
    const loginMe = await request<AuthMeResponse>('GET', '/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${originalAccessToken}`,
      },
    });
    expect(loginMe.status).toBe(200);
    expect(loginMe.data.role).toBe('user');

    await updateUserRole(user.id, 'admin');

    const staleTokenMe = await request<AuthMeResponse>('GET', '/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${originalAccessToken}`,
      },
    });
    expect(staleTokenMe.status).toBe(200);
    expect(staleTokenMe.data.role).toBe('user');

    const refreshToken = getCookieValueFromSetCookie(
      getSetCookieHeaders(login),
      refreshCookieName,
    );
    expect(refreshToken).toEqual(expect.any(String));

    const refresh = await request<AccessTokenResponse>('POST', '/api/v1/auth/refresh', {
      headers: {
        Cookie: buildCookieHeader(refreshCookieName, String(refreshToken)),
      },
    });
    expect(refresh.status).toBe(201);

    const refreshedTokenMe = await request<AuthMeResponse>('GET', '/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${refresh.data.accessToken}`,
      },
    });
    expect(refreshedTokenMe.status).toBe(200);
    expect(refreshedTokenMe.data.role).toBe('admin');
  });

  it('logout invalidates refresh token', async () => {
    const plainPassword = 'LogoutPassw0rd!';
    const user = await createUser(plainPassword);

    const login = await request<AccessTokenResponse>('POST', '/api/v1/auth/login', {
      data: {
        email: user.email,
        password: plainPassword,
      },
    });
    expect(login.status).toBe(201);

    const refreshToken = getCookieValueFromSetCookie(
      getSetCookieHeaders(login),
      refreshCookieName,
    );
    expect(refreshToken).toEqual(expect.any(String));

    const logout = await request<LogoutResponse>('POST', '/api/v1/auth/logout', {
      headers: {
        Cookie: buildCookieHeader(refreshCookieName, String(refreshToken)),
      },
    });
    expect(logout.status).toBe(201);
    expect(logout.data).toEqual({
      success: true,
    });

    const refreshAfterLogout = await request('POST', '/api/v1/auth/refresh', {
      headers: {
        Cookie: buildCookieHeader(refreshCookieName, String(refreshToken)),
      },
    });
    expectApiErrorResponse({
      response: refreshAfterLogout,
      statusCode: 401,
      code: 'AUTH_INVALID_OR_EXPIRED_TOKEN',
    });
  });

  it('replaces previous session when logging in again (single-session policy)', async () => {
    const plainPassword = 'SingleSessionPassw0rd!';
    const user = await createUser(plainPassword);

    const firstLogin = await request<AccessTokenResponse>('POST', '/api/v1/auth/login', {
      data: {
        email: user.email,
        password: plainPassword,
      },
    });
    expect(firstLogin.status).toBe(201);
    const firstRefreshToken = getCookieValueFromSetCookie(
      getSetCookieHeaders(firstLogin),
      refreshCookieName,
    );
    expect(firstRefreshToken).toEqual(expect.any(String));

    const secondLogin = await request<AccessTokenResponse>('POST', '/api/v1/auth/login', {
      data: {
        email: user.email,
        password: plainPassword,
      },
    });
    expect(secondLogin.status).toBe(201);
    const secondRefreshToken = getCookieValueFromSetCookie(
      getSetCookieHeaders(secondLogin),
      refreshCookieName,
    );
    expect(secondRefreshToken).toEqual(expect.any(String));
    expect(secondRefreshToken).not.toBe(firstRefreshToken);

    const refreshWithOldSession = await request('POST', '/api/v1/auth/refresh', {
      headers: {
        Cookie: buildCookieHeader(refreshCookieName, String(firstRefreshToken)),
      },
    });
    expectApiErrorResponse({
      response: refreshWithOldSession,
      statusCode: 401,
      code: 'AUTH_INVALID_OR_EXPIRED_TOKEN',
    });

    const refreshWithCurrentSession = await request('POST', '/api/v1/auth/refresh', {
      headers: {
        Cookie: buildCookieHeader(refreshCookieName, String(secondRefreshToken)),
      },
    });
    expect(refreshWithCurrentSession.status).toBe(201);
  });
});
