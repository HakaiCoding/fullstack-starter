import { HttpException } from '@nestjs/common';
import type { ApiErrorCode, ApiErrorResponse } from '@fullstack-starter/contracts';
import type { Request } from 'express';

interface BodyParserSyntaxError extends Error {
  status?: number;
  type?: string;
  body?: unknown;
}

interface HttpExceptionResponseBody {
  statusCode?: number;
  error?: string;
  message?: string | string[];
}

type CoveredStatusCode = ApiErrorResponse['statusCode'];

export interface NormalizedApiErrorResponse {
  statusCode: CoveredStatusCode;
  body: ApiErrorResponse;
}

export function normalizeApiErrorResponse(params: {
  exception: unknown;
  request: Request;
}): NormalizedApiErrorResponse | null {
  const exceptionMetadata = extractExceptionMetadata(params.exception);
  if (!exceptionMetadata) {
    return null;
  }

  if (
    exceptionMetadata.statusCode !== 400 &&
    exceptionMetadata.statusCode !== 401 &&
    exceptionMetadata.statusCode !== 403
  ) {
    return null;
  }

  if (exceptionMetadata.statusCode === 400) {
    const badRequestMapping = mapBadRequestError(exceptionMetadata);
    return {
      statusCode: 400,
      body: {
        statusCode: 400,
        error: badRequestMapping,
      },
    };
  }

  if (exceptionMetadata.statusCode === 401) {
    const unauthorizedMapping = mapUnauthorizedError({
      request: params.request,
      responseBody: exceptionMetadata.responseBody,
      fallbackMessage: exceptionMetadata.fallbackMessage,
    });

    return {
      statusCode: 401,
      body: {
        statusCode: 401,
        error: unauthorizedMapping,
      },
    };
  }

  return {
    statusCode: 403,
    body: {
      statusCode: 403,
      error: {
        code: 'AUTH_FORBIDDEN',
        message: 'Insufficient permissions.',
      },
    },
  };
}

function extractExceptionMetadata(exception: unknown): {
  statusCode: number;
  responseBody: unknown;
  fallbackMessage: string;
  isBodyParserMalformedJson: boolean;
} | null {
  if (exception instanceof HttpException) {
    return {
      statusCode: exception.getStatus(),
      responseBody: exception.getResponse(),
      fallbackMessage: exception.message,
      isBodyParserMalformedJson: false,
    };
  }

  if (isBodyParserMalformedJsonError(exception)) {
    return {
      statusCode: 400,
      responseBody: {
        message: exception.message,
      },
      fallbackMessage: exception.message,
      isBodyParserMalformedJson: true,
    };
  }

  return null;
}

function mapBadRequestError(params: {
  responseBody: unknown;
  fallbackMessage: string;
  isBodyParserMalformedJson: boolean;
}): {
  code: ApiErrorCode;
  message: string;
  details?: string[];
} {
  const details = extractErrorDetails(
    params.responseBody,
    params.fallbackMessage,
  );

  if (
    params.isBodyParserMalformedJson ||
    looksLikeMalformedJsonError(details, params.fallbackMessage)
  ) {
    return {
      code: 'REQUEST_MALFORMED_JSON',
      message: 'Malformed JSON request body.',
    };
  }

  if (details.length > 0 && details.every(isUnknownFieldValidationDetail)) {
    return {
      code: 'REQUEST_UNKNOWN_FIELD',
      message: 'Request contains unknown fields.',
      details,
    };
  }

  return {
    code: 'REQUEST_VALIDATION_FAILED',
    message: 'Request validation failed.',
    details: details.length > 0 ? details : undefined,
  };
}

function mapUnauthorizedError(params: {
  request: Request;
  responseBody: unknown;
  fallbackMessage: string;
}): {
  code: ApiErrorCode;
  message: string;
} {
  const details = extractErrorDetails(params.responseBody, params.fallbackMessage);
  const lowerDetails = details.map((detail) => detail.toLowerCase());
  if (lowerDetails.some((detail) => detail.includes('invalid credentials'))) {
    return {
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Invalid credentials.',
    };
  }

  const hasBearerToken = hasBearerAuthorizationHeader(params.request);
  const hasInvalidTokenMessage = lowerDetails.some(
    (detail) =>
      detail.includes('invalid refresh token') ||
      detail.includes('invalid access token') ||
      detail.includes('jwt expired') ||
      detail.includes('jwt malformed') ||
      detail.includes('invalid token') ||
      detail.includes('token expired'),
  );

  if (hasBearerToken || hasInvalidTokenMessage) {
    return {
      code: 'AUTH_INVALID_OR_EXPIRED_TOKEN',
      message: 'Authentication token is invalid or expired.',
    };
  }

  return {
    code: 'AUTH_UNAUTHENTICATED',
    message: 'Authentication is required.',
  };
}

function extractErrorDetails(
  responseBody: unknown,
  fallbackMessage: string,
): string[] {
  if (typeof responseBody === 'string') {
    return [responseBody];
  }

  if (!responseBody || typeof responseBody !== 'object') {
    return fallbackMessage.trim() === '' ? [] : [fallbackMessage];
  }

  const typedResponseBody = responseBody as HttpExceptionResponseBody;
  const responseMessage = typedResponseBody.message;
  if (Array.isArray(responseMessage)) {
    return responseMessage.filter((item): item is string => typeof item === 'string');
  }

  if (typeof responseMessage === 'string') {
    return [responseMessage];
  }

  return fallbackMessage.trim() === '' ? [] : [fallbackMessage];
}

function looksLikeMalformedJsonError(
  details: string[],
  fallbackMessage: string,
): boolean {
  const allDetails = [...details, fallbackMessage];
  return allDetails.some((detail) => {
    const normalized = detail.toLowerCase();
    return (
      normalized.includes('unexpected token') ||
      normalized.includes('unexpected end of json input') ||
      normalized.includes('entity.parse.failed') ||
      normalized.includes('json parse')
    );
  });
}

function isUnknownFieldValidationDetail(detail: string): boolean {
  return detail.toLowerCase().includes('should not exist');
}

function hasBearerAuthorizationHeader(request: Request): boolean {
  const rawAuthorization = request.headers.authorization;
  if (Array.isArray(rawAuthorization)) {
    return rawAuthorization.some((value) =>
      value.toLowerCase().startsWith('bearer '),
    );
  }

  return (
    typeof rawAuthorization === 'string' &&
    rawAuthorization.toLowerCase().startsWith('bearer ')
  );
}

function isBodyParserMalformedJsonError(
  exception: unknown,
): exception is BodyParserSyntaxError {
  if (!exception || typeof exception !== 'object') {
    return false;
  }

  const typedError = exception as BodyParserSyntaxError;
  return typedError.status === 400 && typedError.type === 'entity.parse.failed';
}
