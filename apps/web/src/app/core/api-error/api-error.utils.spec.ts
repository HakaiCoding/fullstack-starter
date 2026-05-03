import { HttpErrorResponse } from '@angular/common/http';
import type { ApiErrorCode, ApiErrorResponse } from '@fullstack-starter/contracts';
import { extractApiErrorResponse, toFrontendApiError } from './api-error.utils';

describe('api-error.utils', () => {
  it('extracts a stable API error envelope from HttpErrorResponse', () => {
    const body: ApiErrorResponse = {
      statusCode: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service unavailable.',
      },
    };

    const extracted = extractApiErrorResponse(
      new HttpErrorResponse({
        status: 503,
        statusText: 'Service Unavailable',
        error: body,
      }),
    );

    expect(extracted).toEqual(body);
  });

  it('returns null when the error body does not match the stable API envelope', () => {
    const extracted = extractApiErrorResponse(
      new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        error: {
          message: 'unstructured',
        },
      }),
    );

    expect(extracted).toBeNull();
  });

  it('maps stable API error codes to frontend-safe user messages', () => {
    const mappings: Array<{
      statusCode: ApiErrorResponse['statusCode'];
      code: ApiErrorCode;
      expectedMessage: string;
    }> = [
      {
        statusCode: 400,
        code: 'REQUEST_VALIDATION_FAILED',
        expectedMessage: 'Please review your input and try again.',
      },
      {
        statusCode: 400,
        code: 'REQUEST_UNKNOWN_FIELD',
        expectedMessage: 'Please review your input and try again.',
      },
      {
        statusCode: 400,
        code: 'REQUEST_MALFORMED_JSON',
        expectedMessage: 'Please review your input and try again.',
      },
      {
        statusCode: 401,
        code: 'AUTH_UNAUTHENTICATED',
        expectedMessage: 'Please sign in and try again.',
      },
      {
        statusCode: 401,
        code: 'AUTH_INVALID_CREDENTIALS',
        expectedMessage: 'Login failed. Please check your credentials and try again.',
      },
      {
        statusCode: 401,
        code: 'AUTH_INVALID_OR_EXPIRED_TOKEN',
        expectedMessage: 'Your session expired. Please sign in again.',
      },
      {
        statusCode: 403,
        code: 'AUTH_FORBIDDEN',
        expectedMessage: 'You do not have permission to perform this action.',
      },
      {
        statusCode: 404,
        code: 'RESOURCE_NOT_FOUND',
        expectedMessage: 'The requested resource was not found.',
      },
      {
        statusCode: 409,
        code: 'RESOURCE_CONFLICT',
        expectedMessage: 'This request could not be completed due to a conflict.',
      },
      {
        statusCode: 503,
        code: 'SERVICE_UNAVAILABLE',
        expectedMessage: 'Service is temporarily unavailable. Please try again.',
      },
      {
        statusCode: 500,
        code: 'INTERNAL_SERVER_ERROR',
        expectedMessage: 'An unexpected error occurred. Please try again.',
      },
    ];

    for (const mapping of mappings) {
      const frontendError = toFrontendApiError(
        new HttpErrorResponse({
          status: mapping.statusCode,
          error: {
            statusCode: mapping.statusCode,
            error: {
              code: mapping.code,
              message: 'server-message-not-used',
              details: ['email should not be empty'],
            },
          } satisfies ApiErrorResponse,
        }),
      );

      expect(frontendError).toEqual({
        kind: 'api',
        userMessage: mapping.expectedMessage,
        statusCode: mapping.statusCode,
        apiErrorCode: mapping.code,
      });
    }
  });

  it('does not leak validation detail wording into user-facing messages', () => {
    const frontendError = toFrontendApiError(
      new HttpErrorResponse({
        status: 400,
        error: {
          statusCode: 400,
          error: {
            code: 'REQUEST_VALIDATION_FAILED',
            message: 'Request validation failed.',
            details: ['password must be at least 8 characters'],
          },
        } satisfies ApiErrorResponse,
      }),
    );

    expect(frontendError.userMessage).toBe('Please review your input and try again.');
    expect(frontendError.userMessage).not.toContain('password must be at least 8 characters');
  });

  it('maps status-0 failures to a network-safe fallback', () => {
    const frontendError = toFrontendApiError(
      new HttpErrorResponse({
        status: 0,
        statusText: 'Unknown Error',
      }),
    );

    expect(frontendError).toEqual({
      kind: 'network',
      userMessage: 'Network error. Please check your connection and try again.',
      statusCode: null,
      apiErrorCode: null,
    });
  });

  it('maps unknown errors to a generic fallback and supports custom fallback text', () => {
    expect(toFrontendApiError(new Error('boom'))).toEqual({
      kind: 'unknown',
      userMessage: 'Something went wrong. Please try again.',
      statusCode: null,
      apiErrorCode: null,
    });

    expect(
      toFrontendApiError(new Error('boom'), {
        fallbackMessage: 'Temporary issue. Please retry.',
      }),
    ).toEqual({
      kind: 'unknown',
      userMessage: 'Temporary issue. Please retry.',
      statusCode: null,
      apiErrorCode: null,
    });
  });
});
