import type { ApiErrorCode, ApiErrorResponse } from '@fullstack-starter/contracts';

export type FrontendApiErrorKind = 'api' | 'network' | 'unknown';

export interface FrontendApiError {
  kind: FrontendApiErrorKind;
  userMessage: string;
  statusCode: ApiErrorResponse['statusCode'] | null;
  apiErrorCode: ApiErrorCode | null;
}
