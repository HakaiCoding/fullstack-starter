import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { SystemApiService } from './system-api.service';
import { SystemStateService } from './system-state.service';

describe('SystemStateService', () => {
  const apiRootResponse = {
    name: 'Fullstack Starter API',
    version: 'v1',
    status: 'ok',
  } as const;
  const apiHealthResponse = {
    status: 'ok',
    checks: {
      api: 'ok',
    },
  } as const;
  const databaseReadinessResponse = {
    status: 'ok',
    checks: {
      database: 'ok',
    },
  } as const;

  let service: SystemStateService;
  let systemApi: {
    getApiRoot: ReturnType<typeof vi.fn>;
    getApiHealth: ReturnType<typeof vi.fn>;
    getDatabaseReadiness: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    systemApi = {
      getApiRoot: vi.fn().mockReturnValue(of(apiRootResponse)),
      getApiHealth: vi.fn().mockReturnValue(of(apiHealthResponse)),
      getDatabaseReadiness: vi.fn().mockReturnValue(of(databaseReadinessResponse)),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SystemApiService, useValue: systemApi as unknown as SystemApiService },
      ],
    });

    service = TestBed.inject(SystemStateService);
  });

  it('starts with empty system state and no loading/error', () => {
    expect(service.apiRoot()).toBeNull();
    expect(service.apiHealth()).toBeNull();
    expect(service.databaseReadiness()).toBeNull();
    expect(service.lastApiError()).toBeNull();
    expect(service.isLoading()).toBe(false);
  });

  it('loads and stores api root state', () => {
    service.loadApiRoot().subscribe((value) => {
      expect(value).toEqual(apiRootResponse);
    });

    expect(systemApi.getApiRoot).toHaveBeenCalledTimes(1);
    expect(service.apiRoot()).toEqual(apiRootResponse);
    expect(service.lastApiError()).toBeNull();
    expect(service.isLoading()).toBe(false);
  });

  it('tracks loading during api root request and clears loading on success completion', () => {
    const inFlightRequest$ = new Subject<typeof apiRootResponse>();
    systemApi.getApiRoot.mockReturnValueOnce(inFlightRequest$.asObservable());
    let response: typeof apiRootResponse | null = null;

    service.loadApiRoot().subscribe((value) => {
      response = value;
    });

    expect(service.isLoading()).toBe(true);
    expect(service.apiRoot()).toBeNull();

    inFlightRequest$.next(apiRootResponse);
    expect(service.apiRoot()).toEqual(apiRootResponse);
    expect(response).toEqual(apiRootResponse);
    expect(service.isLoading()).toBe(true);

    inFlightRequest$.complete();
    expect(service.isLoading()).toBe(false);
  });

  it('loads and stores api health state', () => {
    service.loadApiHealth().subscribe((value) => {
      expect(value).toEqual(apiHealthResponse);
    });

    expect(systemApi.getApiHealth).toHaveBeenCalledTimes(1);
    expect(service.apiHealth()).toEqual(apiHealthResponse);
    expect(service.lastApiError()).toBeNull();
    expect(service.isLoading()).toBe(false);
  });

  it('loads and stores database readiness state', () => {
    service.loadDatabaseReadiness().subscribe((value) => {
      expect(value).toEqual(databaseReadinessResponse);
    });

    expect(systemApi.getDatabaseReadiness).toHaveBeenCalledTimes(1);
    expect(service.databaseReadiness()).toEqual(databaseReadinessResponse);
    expect(service.lastApiError()).toBeNull();
    expect(service.isLoading()).toBe(false);
  });

  it('loads all system endpoints and stores a snapshot', () => {
    let snapshot:
      | {
          apiRoot: typeof apiRootResponse;
          apiHealth: typeof apiHealthResponse;
          databaseReadiness: typeof databaseReadinessResponse;
        }
      | null = null;

    service.loadAll().subscribe((value) => {
      snapshot = value;
    });

    expect(systemApi.getApiRoot).toHaveBeenCalledTimes(1);
    expect(systemApi.getApiHealth).toHaveBeenCalledTimes(1);
    expect(systemApi.getDatabaseReadiness).toHaveBeenCalledTimes(1);
    expect(snapshot).toEqual({
      apiRoot: apiRootResponse,
      apiHealth: apiHealthResponse,
      databaseReadiness: databaseReadinessResponse,
    });
    expect(service.apiRoot()).toEqual(apiRootResponse);
    expect(service.apiHealth()).toEqual(apiHealthResponse);
    expect(service.databaseReadiness()).toEqual(databaseReadinessResponse);
  });

  it('captures stable api error envelope when a request fails', () => {
    const stableErrorBody = {
      statusCode: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service unavailable.',
      },
    } as const;
    systemApi.getDatabaseReadiness.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
            statusText: 'Service Unavailable',
            error: stableErrorBody,
          }),
      ),
    );

    let receivedStatus: number | null = null;
    service.loadDatabaseReadiness().subscribe({
      error: (error: HttpErrorResponse) => {
        receivedStatus = error.status;
      },
    });

    expect(receivedStatus).toBe(503);
    expect(service.lastApiError()).toEqual(stableErrorBody);
    expect(service.isLoading()).toBe(false);
  });

  it('tracks loading during database readiness request and clears loading after failure', () => {
    const inFlightRequest$ = new Subject<typeof databaseReadinessResponse>();
    systemApi.getDatabaseReadiness.mockReturnValueOnce(inFlightRequest$.asObservable());
    const stableErrorBody = {
      statusCode: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service unavailable.',
      },
    } as const;

    let receivedStatus: number | null = null;
    service.loadDatabaseReadiness().subscribe({
      error: (error: HttpErrorResponse) => {
        receivedStatus = error.status;
      },
    });

    expect(service.isLoading()).toBe(true);
    expect(service.databaseReadiness()).toBeNull();

    inFlightRequest$.error(
      new HttpErrorResponse({
        status: 503,
        statusText: 'Service Unavailable',
        error: stableErrorBody,
      }),
    );

    expect(receivedStatus).toBe(503);
    expect(service.lastApiError()).toEqual(stableErrorBody);
    expect(service.databaseReadiness()).toBeNull();
    expect(service.isLoading()).toBe(false);
  });

  it('keeps loadAll all-or-nothing when one endpoint fails after other endpoint responses complete', () => {
    const apiRootInFlight$ = new Subject<typeof apiRootResponse>();
    const apiHealthInFlight$ = new Subject<typeof apiHealthResponse>();
    const databaseInFlight$ = new Subject<typeof databaseReadinessResponse>();
    const stableErrorBody = {
      statusCode: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service unavailable.',
      },
    } as const;

    systemApi.getApiRoot.mockReturnValueOnce(apiRootInFlight$.asObservable());
    systemApi.getApiHealth.mockReturnValueOnce(apiHealthInFlight$.asObservable());
    systemApi.getDatabaseReadiness.mockReturnValueOnce(databaseInFlight$.asObservable());

    let receivedStatus: number | null = null;
    service.loadAll().subscribe({
      error: (error: HttpErrorResponse) => {
        receivedStatus = error.status;
      },
    });

    expect(service.isLoading()).toBe(true);

    apiRootInFlight$.next({
      name: 'Fullstack Starter API',
      version: 'v1',
      status: 'ok',
    });
    apiRootInFlight$.complete();

    apiHealthInFlight$.next({
      status: 'ok',
      checks: {
        api: 'ok',
      },
    });
    apiHealthInFlight$.complete();

    expect(service.apiRoot()).toBeNull();
    expect(service.apiHealth()).toBeNull();
    expect(service.databaseReadiness()).toBeNull();

    databaseInFlight$.error(
      new HttpErrorResponse({
        status: 503,
        statusText: 'Service Unavailable',
        error: stableErrorBody,
      }),
    );

    expect(receivedStatus).toBe(503);
    expect(service.lastApiError()).toEqual(stableErrorBody);
    expect(service.apiRoot()).toBeNull();
    expect(service.apiHealth()).toBeNull();
    expect(service.databaseReadiness()).toBeNull();
    expect(service.isLoading()).toBe(false);
  });

  it('clears all system state', () => {
    service.loadAll().subscribe();
    expect(service.apiRoot()).toEqual(apiRootResponse);
    expect(service.apiHealth()).toEqual(apiHealthResponse);
    expect(service.databaseReadiness()).toEqual(databaseReadinessResponse);

    service.clear();

    expect(service.apiRoot()).toBeNull();
    expect(service.apiHealth()).toBeNull();
    expect(service.databaseReadiness()).toBeNull();
    expect(service.lastApiError()).toBeNull();
    expect(service.isLoading()).toBe(false);
  });
});
