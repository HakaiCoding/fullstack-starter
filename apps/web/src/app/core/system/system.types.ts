import type { ApiErrorResponse } from '@fullstack-starter/contracts';

export interface ApiRootResponse {
  name: 'Fullstack Starter API';
  version: 'v1';
  status: 'ok';
}

export interface ApiHealthResponse {
  status: 'ok';
  checks: {
    api: 'ok';
  };
}

export interface ApiDatabaseReadinessResponse {
  status: 'ok';
  checks: {
    database: 'ok';
  };
}

export interface SystemStatusSnapshot {
  apiRoot: ApiRootResponse;
  apiHealth: ApiHealthResponse;
  databaseReadiness: ApiDatabaseReadinessResponse;
}

export type SystemStatusApiError = ApiErrorResponse;
