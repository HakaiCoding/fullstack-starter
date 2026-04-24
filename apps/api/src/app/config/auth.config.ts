import { registerAs } from '@nestjs/config';

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);
const SAME_SITE_VALUES = new Set(['strict', 'lax', 'none']);

export type RefreshCookieSameSite = 'strict' | 'lax' | 'none';

export interface AuthTokenConfig {
  secret: string;
  ttlSeconds: number;
}

export interface AuthRefreshCookieConfig {
  name: string;
  secure: boolean;
  sameSite: RefreshCookieSameSite;
  httpOnly: true;
  path: '/';
}

export interface AuthConfig {
  accessToken: AuthTokenConfig;
  refreshToken: AuthTokenConfig;
  refreshCookie: AuthRefreshCookieConfig;
}

function parseRequiredPositiveInteger(
  value: string | undefined,
  key: string,
): number {
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${key} value "${value}". Expected a positive integer.`);
  }

  return parsed;
}

function parseBooleanFlag(
  value: string | undefined,
  key: string,
): boolean {
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  throw new Error(
    `Invalid ${key} value "${value}". Use one of: true,false,1,0,yes,no,on,off.`,
  );
}

function parseSameSite(
  value: string | undefined,
  key: string,
): RefreshCookieSameSite {
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  const normalized = value.trim().toLowerCase();
  if (!SAME_SITE_VALUES.has(normalized)) {
    throw new Error(
      `Invalid ${key} value "${value}". Use one of: strict,lax,none.`,
    );
  }

  return normalized as RefreshCookieSameSite;
}

export function buildAuthConfig(env: NodeJS.ProcessEnv): AuthConfig {
  return {
    accessToken: {
      secret: env.AUTH_ACCESS_TOKEN_SECRET ?? '',
      ttlSeconds: parseRequiredPositiveInteger(
        env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
        'AUTH_ACCESS_TOKEN_TTL_SECONDS',
      ),
    },
    refreshToken: {
      secret: env.AUTH_REFRESH_TOKEN_SECRET ?? '',
      ttlSeconds: parseRequiredPositiveInteger(
        env.AUTH_REFRESH_TOKEN_TTL_SECONDS,
        'AUTH_REFRESH_TOKEN_TTL_SECONDS',
      ),
    },
    refreshCookie: {
      name: env.AUTH_REFRESH_COOKIE_NAME ?? '',
      secure: parseBooleanFlag(
        env.AUTH_REFRESH_COOKIE_SECURE,
        'AUTH_REFRESH_COOKIE_SECURE',
      ),
      sameSite: parseSameSite(
        env.AUTH_REFRESH_COOKIE_SAME_SITE,
        'AUTH_REFRESH_COOKIE_SAME_SITE',
      ),
      httpOnly: true,
      path: '/',
    },
  };
}

export const authConfig = registerAs('auth', (): AuthConfig =>
  buildAuthConfig(process.env),
);
