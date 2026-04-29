import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
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

  it('maps not found errors to RESOURCE_NOT_FOUND', () => {
    const normalized = normalizeApiErrorResponse({
      exception: new NotFoundException('Not found.'),
      request: createRequest(),
    });

    expect(normalized).toEqual({
      statusCode: 404,
      body: {
        statusCode: 404,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Resource not found.',
        },
      },
    });
  });

  it('maps conflict errors to RESOURCE_CONFLICT', () => {
    const normalized = normalizeApiErrorResponse({
      exception: new ConflictException('Duplicate resource.'),
      request: createRequest(),
    });

    expect(normalized).toEqual({
      statusCode: 409,
      body: {
        statusCode: 409,
        error: {
          code: 'RESOURCE_CONFLICT',
          message: 'Request could not be completed due to a conflict.',
        },
      },
    });
  });

  it('maps 500 HttpExceptions to a sanitized INTERNAL_SERVER_ERROR fallback', () => {
    const normalized = normalizeApiErrorResponse({
      exception: new InternalServerErrorException(
        'SQLSTATE[23505] duplicate key in C:\\repo\\apps\\api\\service.ts at AuthService.handle()',
      ),
      request: createRequest(),
    });

    expect(normalized).toEqual({
      statusCode: 500,
      body: {
        statusCode: 500,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      },
    });
    expect(normalized?.body.error).not.toHaveProperty('details');
  });

  it('maps non-HttpException errors to a sanitized INTERNAL_SERVER_ERROR fallback', () => {
    const error = new Error(
      'SequelizeDatabaseError: duplicate key value violates unique constraint "UQ_users_email" at C:\\Users\\Development\\Desktop\\git\\fullstack-starter\\apps\\api\\src\\db\\repo.ts',
    );
    error.stack = 'Error: stack trace should not leak';

    const normalized = normalizeApiErrorResponse({
      exception: error,
      request: createRequest(),
    });

    expect(normalized).toEqual({
      statusCode: 500,
      body: {
        statusCode: 500,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      },
    });

    const serializedBody = JSON.stringify(normalized?.body ?? {});
    expect(serializedBody.toLowerCase()).not.toContain('sqlstate');
    expect(serializedBody.toLowerCase()).not.toContain('duplicate key');
    expect(serializedBody.toLowerCase()).not.toContain('stack trace');
    expect(serializedBody.toLowerCase()).not.toContain('authservice');
    expect(serializedBody.toLowerCase()).not.toContain('c:\\users\\development');
  });

  it('returns null for statuses outside covered contract set', () => {
    const normalized = normalizeApiErrorResponse({
      exception: new ServiceUnavailableException('Service unavailable.'),
      request: createRequest(),
    });

    expect(normalized).toBeNull();
  });
});
