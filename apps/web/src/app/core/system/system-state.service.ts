import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, forkJoin, tap, throwError } from 'rxjs';
import { extractApiErrorResponse } from '../api-error/api-error.utils';
import { SystemApiService } from './system-api.service';
import type {
  ApiDatabaseReadinessResponse,
  ApiHealthResponse,
  ApiRootResponse,
  SystemStatusApiError,
  SystemStatusSnapshot,
} from './system.types';

@Injectable({ providedIn: 'root' })
export class SystemStateService {
  private readonly systemApi = inject(SystemApiService);
  private readonly apiRootState = signal<ApiRootResponse | null>(null);
  private readonly apiHealthState = signal<ApiHealthResponse | null>(null);
  private readonly databaseReadinessState = signal<ApiDatabaseReadinessResponse | null>(null);
  private readonly lastApiErrorState = signal<SystemStatusApiError | null>(null);
  private readonly pendingRequestCountState = signal(0);

  readonly apiRoot = this.apiRootState.asReadonly();
  readonly apiHealth = this.apiHealthState.asReadonly();
  readonly databaseReadiness = this.databaseReadinessState.asReadonly();
  readonly lastApiError = this.lastApiErrorState.asReadonly();
  readonly isLoading = computed(() => this.pendingRequestCountState() > 0);

  loadApiRoot(): Observable<ApiRootResponse> {
    return this.runRequest(this.systemApi.getApiRoot(), (response) => {
      this.apiRootState.set(response);
    });
  }

  loadApiHealth(): Observable<ApiHealthResponse> {
    return this.runRequest(this.systemApi.getApiHealth(), (response) => {
      this.apiHealthState.set(response);
    });
  }

  loadDatabaseReadiness(): Observable<ApiDatabaseReadinessResponse> {
    return this.runRequest(this.systemApi.getDatabaseReadiness(), (response) => {
      this.databaseReadinessState.set(response);
    });
  }

  loadAll(): Observable<SystemStatusSnapshot> {
    return this.runRequest(
      forkJoin({
        apiRoot: this.systemApi.getApiRoot(),
        apiHealth: this.systemApi.getApiHealth(),
        databaseReadiness: this.systemApi.getDatabaseReadiness(),
      }),
      (snapshot) => {
        this.apiRootState.set(snapshot.apiRoot);
        this.apiHealthState.set(snapshot.apiHealth);
        this.databaseReadinessState.set(snapshot.databaseReadiness);
      },
    );
  }

  clear(): void {
    this.apiRootState.set(null);
    this.apiHealthState.set(null);
    this.databaseReadinessState.set(null);
    this.lastApiErrorState.set(null);
    this.pendingRequestCountState.set(0);
  }

  private runRequest<T>(request$: Observable<T>, onSuccess: (value: T) => void): Observable<T> {
    this.pendingRequestCountState.update((count) => count + 1);
    this.lastApiErrorState.set(null);

    return request$.pipe(
      tap((value) => {
        onSuccess(value);
      }),
      catchError((error: unknown) => {
        this.lastApiErrorState.set(this.tryExtractApiError(error));
        return throwError(() => error);
      }),
      finalize(() => {
        this.pendingRequestCountState.update((count) => Math.max(0, count - 1));
      }),
    );
  }

  private tryExtractApiError(error: unknown): SystemStatusApiError | null {
    return extractApiErrorResponse(error);
  }
}
