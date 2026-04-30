import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  ApiDatabaseReadinessResponse,
  ApiHealthResponse,
  ApiRootResponse,
} from './system.types';

@Injectable({ providedIn: 'root' })
export class SystemApiService {
  private readonly http = inject(HttpClient);

  getApiRoot() {
    return this.http.get<ApiRootResponse>('/api/v1');
  }

  getApiHealth() {
    return this.http.get<ApiHealthResponse>('/api/v1/health');
  }

  getDatabaseReadiness() {
    return this.http.get<ApiDatabaseReadinessResponse>('/api/v1/health/db');
  }
}
