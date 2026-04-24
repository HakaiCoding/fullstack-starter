import { registerAs } from '@nestjs/config';

const SUPPORTED_ORIGIN_PROTOCOLS = new Set(['http:', 'https:']);

export interface CorsConfig {
  allowedOrigins: string[];
  credentials: true;
}

export function parseCorsAllowedOrigins(
  value: string | undefined,
  key = 'API_CORS_ALLOWED_ORIGINS',
): string[] {
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  const parsedOrigins: string[] = [];
  const seenOrigins = new Set<string>();
  const rawOrigins = value.split(',');

  for (const rawOrigin of rawOrigins) {
    const candidate = rawOrigin.trim();
    if (candidate === '') {
      continue;
    }

    let parsed: URL;
    try {
      parsed = new URL(candidate);
    } catch {
      throw new Error(
        `Invalid ${key} value "${candidate}". Expected a valid http/https origin.`,
      );
    }

    if (!SUPPORTED_ORIGIN_PROTOCOLS.has(parsed.protocol)) {
      throw new Error(
        `Invalid ${key} value "${candidate}". Only http and https origins are supported.`,
      );
    }

    const normalizedOrigin = parsed.origin;
    if (!seenOrigins.has(normalizedOrigin)) {
      seenOrigins.add(normalizedOrigin);
      parsedOrigins.push(normalizedOrigin);
    }
  }

  if (parsedOrigins.length === 0) {
    throw new Error(
      `Invalid ${key} value "${value}". Provide at least one valid http/https origin.`,
    );
  }

  return parsedOrigins;
}

export function buildCorsConfig(env: NodeJS.ProcessEnv): CorsConfig {
  return {
    allowedOrigins: parseCorsAllowedOrigins(env.API_CORS_ALLOWED_ORIGINS),
    credentials: true,
  };
}

export const corsConfig = registerAs('cors', (): CorsConfig =>
  buildCorsConfig(process.env),
);
