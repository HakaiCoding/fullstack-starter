type Environment = Record<string, unknown>;

const REQUIRED_DB_KEYS = [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
] as const;

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

function readRequiredString(env: Environment, key: (typeof REQUIRED_DB_KEYS)[number]) {
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

function validatePort(port: string) {
  const parsedPort = Number(port);

  if (
    !Number.isInteger(parsedPort) ||
    parsedPort < 1 ||
    parsedPort > 65535
  ) {
    throw new Error(
      `Invalid POSTGRES_PORT value "${port}". Expected an integer between 1 and 65535.`,
    );
  }

  return String(parsedPort);
}

function normalizeSslFlag(sslFlag: string) {
  const normalized = sslFlag.toLowerCase();

  if (TRUE_VALUES.has(normalized) || FALSE_VALUES.has(normalized)) {
    return normalized;
  }

  throw new Error(
    `Invalid POSTGRES_SSL value "${sslFlag}". Use one of: true,false,1,0,yes,no,on,off.`,
  );
}

export function validateEnvironment(env: Environment): Environment {
  const host = readRequiredString(env, 'POSTGRES_HOST');
  const port = validatePort(readRequiredString(env, 'POSTGRES_PORT'));
  const db = readRequiredString(env, 'POSTGRES_DB');
  const user = readRequiredString(env, 'POSTGRES_USER');
  const password = readRequiredString(env, 'POSTGRES_PASSWORD');

  const sslFlagRaw = readOptionalString(env, 'POSTGRES_SSL');
  const sslFlag = sslFlagRaw ? normalizeSslFlag(sslFlagRaw) : 'false';

  return {
    ...env,
    POSTGRES_HOST: host,
    POSTGRES_PORT: port,
    POSTGRES_DB: db,
    POSTGRES_USER: user,
    POSTGRES_PASSWORD: password,
    POSTGRES_SSL: sslFlag,
  };
}
