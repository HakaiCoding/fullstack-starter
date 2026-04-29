import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { normalizeApiErrorResponse } from './api-error-response.normalizer';

function createRequest(headers: Record<string, string> = {}): Request {
  return {
    headers,
  } as Request;
}

describe('normalizeApiErrorResponse', () => {
  it('maps validation bad requests to REQUEST_VALIDATION_FAILED', () => {
    const normalized = normalizeApiErrorResponse({
      exception: new BadRequestException({
        statusCode: 400,
        message: ['email must be a string'],
      }),
      request: createRequest(),
    });

    expect(normalized).toEqual({
      statusCode: 400,
      body: {
        statusCode: 400,
        error: {
          code: 'REQUEST_VALIDATION_FAILED',
          message: 'Request validation failed.',
          details: ['email must be a string'],
        },
      },
    });
  });

  it('maps unknown-field validation errors to REQUEST_UNKNOWN_FIELD', () => {
    const normalized = normalizeApiErrorResponse({
      exception: new BadRequestException({
        statusCode: 400,
        message: ['property extra should not exist'],
      }),
      request: createRequest(),
    });

    expect(normalized).toEqual({
      statusCode: 400,
      body: {
        statusCode: 400,
        error: {
          code: 'REQUEST_UNKNOWN_FIELD',
          message: 'Request contains unknown fields.',
          details: ['property extra should not exist'],
        },
      },
    });
  });

  it('maps malformed json bad requests to REQUEST_MALFORMED_JSON', () => {
    const normalized = normalizeApiErrorResponse({
      exception: new BadRequestException({
        statusCode: 400,
        message: 'Unexpected token "}" in JSON at position 16',
      }),
      request: createRequest(),
    });

    expect(normalized).toEqual({
      statusCode: 400,
      body: {
        statusCode: 400,
        error: {
          code: 'REQUEST_MALFORMED_JSON',
          message: 'Malformed JSON request body.',
        },
      },
    });
  });

  it('maps invalid credentials to AUTH_INVALID_CREDENTIALS', () => {
    const normalized = normalizeApiErrorResponse({
      exception: new UnauthorizedException('Invalid credentials.'),
      request: createRequest(),
    });

    expect(normalized).toEqual({
      statusCode: 401,
      body: {
        statusCode: 401,
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid credentials.',
        },
      },
    });
  });

  it('maps missing authentication context to AUTH_UNAUTHENTICATED', () => {
    const normalized = normalizeApiErrorResponse({
      exception: new UnauthorizedException('Unauthorized'),
      request: createRequest(),
    });

    expect(normalized).toEqual({
      statusCode: 401,
      body: {
        statusCode: 401,
        error: {
          code: 'AUTH_UNAUTHENTICATED',
          message: 'Authentication is required.',
        },
      },
    });
  });

  it('maps requests with presented bearer token to AUTH_INVALID_OR_EXPIRED_TOKEN', () => {
    const normalized = normalizeApiErrorResponse({
      exception: new UnauthorizedException('Invalid access token.'),
      request: createRequest({
        authorization: 'Bearer invalid-token',
      }),
    });

    expect(normalized).toEqual({
      statusCode: 401,
      body: {
        statusCode: 401,
        error: {
          code: 'AUTH_INVALID_OR_EXPIRED_TOKEN',
          message: 'Authentication token is invalid or expired.',
        },
      },
    });
  });

  it('keeps missing bearer-token requests unauthenticated even when refresh cookie is present', () => {
    const normalized = normalizeApiErrorResponse({
      exception: new UnauthorizedException('Unauthorized'),
      request: createRequest({
        cookie: 'refresh_token=abc123',
      }),
    });

    expect(normalized).toEqual({
      statusCode: 401,
      body: {
        statusCode: 401,
        error: {
          code: 'AUTH_UNAUTHENTICATED',
          message: 'Authentication is required.',
        },
      },
    });
  });

  it('maps invalid refresh-token messages to AUTH_INVALID_OR_EXPIRED_TOKEN', () => {
    const normalized = normalizeApiErrorResponse({
      exception: new UnauthorizedException('Invalid refresh token.'),
      request: createRequest(),
    });

    expect(normalized).toEqual({
      statusCode: 401,
      body: {
        statusCode: 401,
        error: {
          code: 'AUTH_INVALID_OR_EXPIRED_TOKEN',
          message: 'Authentication token is invalid or expired.',
        },
      },
    });
  });

  it('maps forbidden errors to AUTH_FORBIDDEN', () => {
    const normalized = normalizeApiErrorResponse({
      exception: new ForbiddenException('Insufficient role.'),
      request: createRequest(),
    });

    expect(normalized).toEqual({
      statusCode: 403,
      body: {
        statusCode: 403,
        error: {
          code: 'AUTH_FORBIDDEN',
          message: 'Insufficient permissions.',
        },
      },
    });
  });

  it('returns null for statuses outside first-slice contract', () => {
    const normalized = normalizeApiErrorResponse({
      exception: new NotFoundException('Not found.'),
      request: createRequest(),
    });

    expect(normalized).toBeNull();
  });
});
