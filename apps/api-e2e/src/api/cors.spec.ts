import axios, { type AxiosResponse, type Method } from 'axios';

function readRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
}

function readAllowedOrigin(): string {
  const rawAllowlist = readRequiredEnv('API_CORS_ALLOWED_ORIGINS');
  const firstAllowedOrigin = rawAllowlist
    .split(',')
    .map((origin) => origin.trim())
    .find((origin) => origin !== '');

  if (!firstAllowedOrigin) {
    throw new Error('API_CORS_ALLOWED_ORIGINS must contain at least one origin.');
  }

  return new URL(firstAllowedOrigin).origin;
}

async function request<T>(
  method: Method,
  url: string,
  options: {
    headers?: Record<string, string>;
  } = {},
): Promise<AxiosResponse<T>> {
  return axios.request<T>({
    method,
    url,
    headers: options.headers,
    validateStatus: () => true,
  });
}

describe('API CORS e2e', () => {
  const allowedOrigin = readAllowedOrigin();
  const disallowedOrigin = 'https://not-allowed.example.com';

  it('returns CORS allow-origin and credentials headers for allowlisted origin', async () => {
    const response = await request<{ message: string }>('GET', '/api/v1', {
      headers: {
        Origin: allowedOrigin,
      },
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ message: 'Hello API' });
    expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('handles allowlisted preflight request with CORS headers', async () => {
    const response = await request('OPTIONS', '/api/v1/auth/refresh', {
      headers: {
        Origin: allowedOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization',
      },
    });

    expect([200, 204]).toContain(response.status);
    expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');

    const allowMethods = String(
      response.headers['access-control-allow-methods'] ?? '',
    ).toUpperCase();
    expect(allowMethods).toContain('POST');
  });

  it('does not allow disallowed preflight origin', async () => {
    const response = await request('OPTIONS', '/api/v1/auth/refresh', {
      headers: {
        Origin: disallowedOrigin,
        'Access-Control-Request-Method': 'POST',
      },
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(600);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
