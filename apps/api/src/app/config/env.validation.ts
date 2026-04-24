import { parseCorsAllowedOrigins } from './cors.config';

type Environment = Record<string, unknown>;

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);
const SAME_SITE_VALUES = new Set(['strict', 'lax', 'none']);
const MIN_JWT_SECRET_LENGTH = 32;
const LOCAL_LIKE_NODE_ENV_VALUES = new Set([
  'development',
  'dev',
  'local',
  'test',
]);
const KNOWN_PLACEHOLDER_SECRET_PATTERNS = [/^change[_-]?me/i, /^replace[_-]?me/i];

function readRequiredString(env: Environment, key: string) {
  const value = env[key];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
}

function readOptionalString(env: Environment, key: string) {
  const value = env[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`Invalid environment variable type for ${key}: expected string`);
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? undefined : trimmedValue;
}

function validateIntegerInRange(
  value: string,
  key: string,
  min: number,
  max: number,
) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(
      `Invalid ${key} value "${value}". Expected an integer between ${String(min)} and ${String(max)}.`,
    );
  }

  return String(parsed);
}

function normalizeBooleanFlag(rawValue: string, key: string) {
  const normalized = rawValue.toLowerCase();

  if (TRUE_VALUES.has(normalized) || FALSE_VALUES.has(normalized)) {
    return normalized;
  }

  throw new Error(
    `Invalid ${key} value "${rawValue}". Use one of: true,false,1,0,yes,no,on,off.`,
  );
}

function normalizeSameSite(rawValue: string, key: string) {
  const normalized = rawValue.toLowerCase();
  if (!SAME_SITE_VALUES.has(normalized)) {
    throw new Error(
      `Invalid ${key} value "${rawValue}". Use one of: strict,lax,none.`,
    );
  }

  return normalized;
}

function validateJwtSecret(secret: string, key: string) {
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `${key} must be at least ${String(MIN_JWT_SECRET_LENGTH)} characters long for HS256 usage.`,
    );
  }

  return secret;
}

function isLocalLikeNodeEnv(nodeEnv: string) {
  return LOCAL_LIKE_NODE_ENV_VALUES.has(nodeEnv);
}

function isTruthyBooleanFlag(value: string) {
  return TRUE_VALUES.has(value);
}

function looksLikePlaceholderSecret(secret: string) {
  return KNOWN_PLACEHOLDER_SECRET_PATTERNS.some((pattern) =>
    pattern.test(secret),
  );
}

function validateNonPlaceholderSecretForRuntime(
  secret: string,
  key: string,
  nodeEnv: string,
) {
  if (isLocalLikeNodeEnv(nodeEnv)) {
    return secret;
  }

  if (looksLikePlaceholderSecret(secret)) {
    throw new Error(
      `${key} looks like a placeholder secret and is not allowed when NODE_ENV="${nodeEnv}".`,
    );
  }

  return secret;
}

export function validateEnvironment(env: Environment): Environment {
  const nodeEnv = readRequiredString(env, 'NODE_ENV').toLowerCase();
  const host = readRequiredString(env, 'POSTGRES_HOST');
  const port = validateIntegerInRange(
    readRequiredString(env, 'POSTGRES_PORT'),
    'POSTGRES_PORT',
    1,
    65535,
  );
  const db = readRequiredString(env, 'POSTGRES_DB');
  const user = readRequiredString(env, 'POSTGRES_USER');
  const password = readRequiredString(env, 'POSTGRES_PASSWORD');

  const sslFlagRaw = readOptionalString(env, 'POSTGRES_SSL');
  const sslFlag = sslFlagRaw
    ? normalizeBooleanFlag(sslFlagRaw, 'POSTGRES_SSL')
    : 'false';

  const accessTokenSecret = validateNonPlaceholderSecretForRuntime(
    validateJwtSecret(
      readRequiredString(env, 'AUTH_ACCESS_TOKEN_SECRET'),
      'AUTH_ACCESS_TOKEN_SECRET',
    ),
    'AUTH_ACCESS_TOKEN_SECRET',
    nodeEnv,
  );
  const accessTokenTtlSeconds = validateIntegerInRange(
    readRequiredString(env, 'AUTH_ACCESS_TOKEN_TTL_SECONDS'),
    'AUTH_ACCESS_TOKEN_TTL_SECONDS',
    1,
    Number.MAX_SAFE_INTEGER,
  );
  const refreshTokenSecret = validateNonPlaceholderSecretForRuntime(
    validateJwtSecret(
      readRequiredString(env, 'AUTH_REFRESH_TOKEN_SECRET'),
      'AUTH_REFRESH_TOKEN_SECRET',
    ),
    'AUTH_REFRESH_TOKEN_SECRET',
    nodeEnv,
  );
  const refreshTokenTtlSeconds = validateIntegerInRange(
    readRequiredString(env, 'AUTH_REFRESH_TOKEN_TTL_SECONDS'),
    'AUTH_REFRESH_TOKEN_TTL_SECONDS',
    1,
    Number.MAX_SAFE_INTEGER,
  );
  const refreshCookieName = readRequiredString(env, 'AUTH_REFRESH_COOKIE_NAME');
  const refreshCookieSecure = normalizeBooleanFlag(
    readRequiredString(env, 'AUTH_REFRESH_COOKIE_SECURE'),
    'AUTH_REFRESH_COOKIE_SECURE',
  );
  const refreshCookieSameSite = normalizeSameSite(
    readRequiredString(env, 'AUTH_REFRESH_COOKIE_SAME_SITE'),
    'AUTH_REFRESH_COOKIE_SAME_SITE',
  );
  const corsAllowedOrigins = parseCorsAllowedOrigins(
    readRequiredString(env, 'API_CORS_ALLOWED_ORIGINS'),
    'API_CORS_ALLOWED_ORIGINS',
  );
  const isRefreshCookieSecure = isTruthyBooleanFlag(refreshCookieSecure);

  if (nodeEnv === 'production' && !isRefreshCookieSecure) {
    throw new Error(
      'AUTH_REFRESH_COOKIE_SECURE must be true when NODE_ENV is production.',
    );
  }

  if (refreshCookieSameSite === 'none' && !isRefreshCookieSecure) {
    throw new Error(
      'AUTH_REFRESH_COOKIE_SAME_SITE=none requires AUTH_REFRESH_COOKIE_SECURE=true.',
    );
  }

  return {
    ...env,
    NODE_ENV: nodeEnv,
    POSTGRES_HOST: host,
    POSTGRES_PORT: port,
    POSTGRES_DB: db,
    POSTGRES_USER: user,
    POSTGRES_PASSWORD: password,
    POSTGRES_SSL: sslFlag,
    AUTH_ACCESS_TOKEN_SECRET: accessTokenSecret,
    AUTH_ACCESS_TOKEN_TTL_SECONDS: accessTokenTtlSeconds,
    AUTH_REFRESH_TOKEN_SECRET: refreshTokenSecret,
    AUTH_REFRESH_TOKEN_TTL_SECONDS: refreshTokenTtlSeconds,
    AUTH_REFRESH_COOKIE_NAME: refreshCookieName,
    AUTH_REFRESH_COOKIE_SECURE: refreshCookieSecure,
    AUTH_REFRESH_COOKIE_SAME_SITE: refreshCookieSameSite,
    API_CORS_ALLOWED_ORIGINS: corsAllowedOrigins.join(','),
  };
}
