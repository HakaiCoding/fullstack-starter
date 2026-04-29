import { type ArgumentsHost, Catch } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import type { Request, Response } from 'express';
import { normalizeApiErrorResponse } from './api-error-response.normalizer';

@Catch()
export class ApiErrorResponseFilter extends BaseExceptionFilter {
  constructor(adapterHost: HttpAdapterHost) {
    super(adapterHost.httpAdapter);
  }

  override catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const normalizedResponse = normalizeApiErrorResponse({
      exception,
      request,
    });

    if (!normalizedResponse) {
      super.catch(exception, host);
      return;
    }

    response.status(normalizedResponse.statusCode).json(normalizedResponse.body);
  }
}
