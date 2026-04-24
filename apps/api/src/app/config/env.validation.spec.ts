import { validateEnvironment } from './env.validation';

type EnvRecord = Record<string, unknown>;

const BASE_VALID_ENV: EnvRecord = {
  NODE_ENV: 'development',
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_DB: 'fullstack_starter',
  POSTGRES_USER: 'app',
  POSTGRES_PASSWORD: 'password',
  POSTGRES_SSL: 'false',
  AUTH_ACCESS_TOKEN_SECRET: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  AUTH_ACCESS_TOKEN_TTL_SECONDS: '900',
  AUTH_REFRESH_TOKEN_SECRET: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  AUTH_REFRESH_TOKEN_TTL_SECONDS: '604800',
  AUTH_REFRESH_COOKIE_NAME: 'refresh_token',
  AUTH_REFRESH_COOKIE_SECURE: 'false',
  AUTH_REFRESH_COOKIE_SAME_SITE: 'lax',
  API_CORS_ALLOWED_ORIGINS: 'http://localhost:4200',
};

function buildEnv(overrides: Partial<EnvRecord> = {}): EnvRecord {
  return {
    ...BASE_VALID_ENV,
    ...overrides,
  };
}

describe('validateEnvironment', () => {
  it('fails fast when API_CORS_ALLOWED_ORIGINS is missing', () => {
    const env = buildEnv();
    delete env.API_CORS_ALLOWED_ORIGINS;

    expect(() => validateEnvironment(env)).toThrow(
      'Missing required environment variable: API_CORS_ALLOWED_ORIGINS',
    );
  });

  it('fails fast when API_CORS_ALLOWED_ORIGINS contains malformed origins', () => {
    expect(() =>
      validateEnvironment(
        buildEnv({
          API_CORS_ALLOWED_ORIGINS: 'localhost:4200',
        }),
      ),
    ).toThrow(/Invalid API_CORS_ALLOWED_ORIGINS value/);
  });

  it('normalizes and dedupes CORS origins in validated output', () => {
    const validated = validateEnvironment(
      buildEnv({
        API_CORS_ALLOWED_ORIGINS:
          ' https://example.com/path , http://localhost:4200/ , https://example.com ',
      }),
    );

    expect(validated.API_CORS_ALLOWED_ORIGINS).toBe(
      'https://example.com,http://localhost:4200',
    );
  });

  it('keeps production secure-cookie enforcement intact', () => {
    expect(() =>
      validateEnvironment(
        buildEnv({
          NODE_ENV: 'production',
          AUTH_REFRESH_COOKIE_SECURE: 'false',
        }),
      ),
    ).toThrow('AUTH_REFRESH_COOKIE_SECURE must be true when NODE_ENV is production.');
  });

  it('keeps SameSite none secure-cookie enforcement intact', () => {
    expect(() =>
      validateEnvironment(
        buildEnv({
          AUTH_REFRESH_COOKIE_SAME_SITE: 'none',
          AUTH_REFRESH_COOKIE_SECURE: 'false',
        }),
      ),
    ).toThrow(
      'AUTH_REFRESH_COOKIE_SAME_SITE=none requires AUTH_REFRESH_COOKIE_SECURE=true.',
    );
  });

  it('keeps placeholder-secret rejection intact outside local/dev/test', () => {
    expect(() =>
      validateEnvironment(
        buildEnv({
          NODE_ENV: 'production',
          AUTH_ACCESS_TOKEN_SECRET:
            'change_me_access_token_secret_minimum_32_chars',
        }),
      ),
    ).toThrow(
      'AUTH_ACCESS_TOKEN_SECRET looks like a placeholder secret and is not allowed when NODE_ENV="production".',
    );
  });
});
