import { HttpErrorResponse } from '@angular/common/http';
import type { ApiErrorCode, ApiErrorResponse } from '@fullstack-starter/contracts';
import type { FrontendApiError } from './api-error.types';

const DEFAULT_UNKNOWN_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const DEFAULT_NETWORK_ERROR_MESSAGE =
  'Network error. Please check your connection and try again.';

const API_ERROR_STATUSES = [
  400,
  401,
  403,
  404,
  409,
  500,
  503,
];

const USER_MESSAGE_BY_CODE: Readonly<Record<ApiErrorCode, string>> = {
  REQUEST_VALIDATION_FAILED: 'Please review your input and try again.',
  REQUEST_UNKNOWN_FIELD: 'Please review your input and try again.',
  REQUEST_MALFORMED_JSON: 'Please review your input and try again.',
  AUTH_UNAUTHENTICATED: 'Please sign in and try again.',
  AUTH_INVALID_CREDENTIALS: 'Login failed. Please check your credentials and try again.',
  AUTH_INVALID_OR_EXPIRED_TOKEN: 'Your session expired. Please sign in again.',
  AUTH_FORBIDDEN: 'You do not have permission to perform this action.',
  RESOURCE_NOT_FOUND: 'The requested resource was not found.',
  RESOURCE_CONFLICT: 'This request could not be completed due to a conflict.',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again.',
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Please try again.',
};

const API_ERROR_CODE_SET: ReadonlySet<ApiErrorCode> = new Set(
  Object.keys(USER_MESSAGE_BY_CODE) as ApiErrorCode[],
);

export function extractApiErrorResponse(error: unknown): ApiErrorResponse | null {
  if (!(error instanceof HttpErrorResponse)) {
    return null;
  }

  return isApiErrorResponse(error.error) ? error.error : null;
}

export function toFrontendApiError(
  error: unknown,
  options?: {
    fallbackMessage?: string;
    networkMessage?: string;
  },
): FrontendApiError {
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return {
      kind: 'network',
      userMessage: options?.networkMessage ?? DEFAULT_NETWORK_ERROR_MESSAGE,
      statusCode: null,
      apiErrorCode: null,
    };
  }

  const apiError = extractApiErrorResponse(error);
  if (apiError) {
    return {
      kind: 'api',
      userMessage: USER_MESSAGE_BY_CODE[apiError.error.code] ?? DEFAULT_UNKNOWN_ERROR_MESSAGE,
      statusCode: apiError.statusCode,
      apiErrorCode: apiError.error.code,
    };
  }

  return {
    kind: 'unknown',
    userMessage: options?.fallbackMessage ?? DEFAULT_UNKNOWN_ERROR_MESSAGE,
    statusCode: null,
    apiErrorCode: null,
  };
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as {
    statusCode?: unknown;
    error?: {
      code?: unknown;
      message?: unknown;
      details?: unknown;
    };
  };

  if (!isApiErrorStatusCode(candidate.statusCode)) {
    return false;
  }

  if (!isApiErrorCode(candidate.error?.code)) {
    return false;
  }

  if (typeof candidate.error.message !== 'string') {
    return false;
  }

  if (
    candidate.error.details !== undefined &&
    (!Array.isArray(candidate.error.details) ||
      candidate.error.details.some((item) => typeof item !== 'string'))
  ) {
    return false;
  }

  return true;
}

function isApiErrorStatusCode(value: unknown): value is ApiErrorResponse['statusCode'] {
  return (
    typeof value === 'number' &&
    API_ERROR_STATUSES.includes(value as ApiErrorResponse['statusCode'])
  );
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === 'string' && API_ERROR_CODE_SET.has(value as ApiErrorCode);
}
