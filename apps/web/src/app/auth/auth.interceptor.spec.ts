import {
  HttpClient,
  HttpContext,
} from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor, authInterceptorContext } from './auth.interceptor';
import { AuthStateService } from './auth-state.service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let authState: AuthStateService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    authState = TestBed.inject(AuthStateService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('attaches bearer token to requests when auth state has an access token', () => {
    authState.setAccessToken('active-token');

    httpClient.get('/api/v1/auth/me').subscribe();

    const request = httpController.expectOne('/api/v1/auth/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer active-token');

    request.flush({
      id: 'user-id',
      email: 'user@example.com',
      displayName: 'User',
      role: 'user',
    });
  });

  it('does not attach bearer token when auth state is empty', () => {
    httpClient.get('/api/v1/auth/me').subscribe();

    const request = httpController.expectOne('/api/v1/auth/me');
    expect(request.request.headers.has('Authorization')).toBe(false);

    request.flush({
      id: 'user-id',
      email: 'user@example.com',
      displayName: 'User',
      role: 'user',
    });
  });

  it('does not refresh on non-401 errors and passes through the original error', () => {
    authState.setAccessToken('active-token');
    let receivedStatus: number | null = null;
    let receivedMessage: string | null = null;

    httpClient.get('/api/v1/protected').subscribe({
      error: (error: { status: number; error?: { message?: string } }) => {
        receivedStatus = error.status;
        receivedMessage = error.error?.message ?? null;
      },
    });

    const request = httpController.expectOne('/api/v1/protected');
    expect(request.request.headers.get('Authorization')).toBe('Bearer active-token');

    request.flush(
      {
        message: 'Forbidden',
      },
      {
        status: 403,
        statusText: 'Forbidden',
      },
    );

    httpController.expectNone('/api/v1/auth/refresh');
    httpController.expectNone('/api/v1/protected');
    expect(receivedStatus).toBe(403);
    expect(receivedMessage).toBe('Forbidden');
    expect(authState.accessToken()).toBe('active-token');
  });

  it('attempts one refresh and one retry for 401 responses on non-auth endpoints', () => {
    authState.setAccessToken('expired-token');
    let responseBody: { ok: boolean } | null = null;

    httpClient.get<{ ok: boolean }>('/api/v1/protected').subscribe((response) => {
      responseBody = response;
    });

    const initialRequest = httpController.expectOne('/api/v1/protected');
    expect(initialRequest.request.headers.get('Authorization')).toBe(
      'Bearer expired-token',
    );

    initialRequest.flush(
      {
        message: 'Unauthorized',
      },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    const refreshRequest = httpController.expectOne('/api/v1/auth/refresh');
    expect(refreshRequest.request.method).toBe('POST');
    expect(refreshRequest.request.withCredentials).toBe(true);
    expect(refreshRequest.request.headers.has('Authorization')).toBe(false);
    refreshRequest.flush({ accessToken: 'refreshed-token' });

    const retriedRequest = httpController.expectOne('/api/v1/protected');
    expect(retriedRequest.request.headers.get('Authorization')).toBe(
      'Bearer refreshed-token',
    );
    retriedRequest.flush({ ok: true });

    expect(responseBody).toEqual({ ok: true });
    expect(authState.accessToken()).toBe('refreshed-token');
  });

  it('does not attempt refresh for login endpoint 401 responses', () => {
    authState.setAccessToken('active-token');
    let receivedStatus: number | null = null;

    httpClient.post('/api/v1/auth/login', {}).subscribe({
      error: (error: { status: number }) => {
        receivedStatus = error.status;
      },
    });

    const loginRequest = httpController.expectOne('/api/v1/auth/login');
    expect(loginRequest.request.headers.get('Authorization')).toBe(
      'Bearer active-token',
    );
    loginRequest.flush(
      {
        message: 'Unauthorized',
      },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    httpController.expectNone('/api/v1/auth/refresh');
    expect(receivedStatus).toBe(401);
  });

  it('does not attempt refresh for refresh endpoint 401 responses', () => {
    authState.setAccessToken('active-token');
    let receivedStatus: number | null = null;

    httpClient.post('/api/v1/auth/refresh', {}).subscribe({
      error: (error: { status: number }) => {
        receivedStatus = error.status;
      },
    });

    const refreshRequest = httpController.expectOne('/api/v1/auth/refresh');
    expect(refreshRequest.request.headers.get('Authorization')).toBe(
      'Bearer active-token',
    );
    refreshRequest.flush(
      {
        message: 'Unauthorized',
      },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    httpController.expectNone('/api/v1/auth/refresh');
    expect(receivedStatus).toBe(401);
  });

  it('does not attempt a second refresh when retried request still returns 401', () => {
    authState.setAccessToken('expired-token');
    let receivedStatus: number | null = null;

    httpClient.get('/api/v1/protected').subscribe({
      error: (error: { status: number }) => {
        receivedStatus = error.status;
      },
    });

    const initialRequest = httpController.expectOne('/api/v1/protected');
    initialRequest.flush(
      {
        message: 'Unauthorized',
      },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    const refreshRequest = httpController.expectOne('/api/v1/auth/refresh');
    refreshRequest.flush({ accessToken: 'refreshed-token' });

    const retriedRequest = httpController.expectOne('/api/v1/protected');
    retriedRequest.flush(
      {
        message: 'Still unauthorized',
      },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    httpController.expectNone('/api/v1/auth/refresh');
    expect(receivedStatus).toBe(401);
    expect(authState.accessToken()).toBeNull();
  });

  it('clears auth state when refresh fails during 401 recovery', () => {
    authState.setAccessToken('expired-token');
    let receivedStatus: number | null = null;

    httpClient.get('/api/v1/protected').subscribe({
      error: (error: { status: number }) => {
        receivedStatus = error.status;
      },
    });

    const initialRequest = httpController.expectOne('/api/v1/protected');
    initialRequest.flush(
      {
        message: 'Unauthorized',
      },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    const refreshRequest = httpController.expectOne('/api/v1/auth/refresh');
    refreshRequest.flush(
      {
        message: 'Unauthorized',
      },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    expect(receivedStatus).toBe(401);
    expect(authState.accessToken()).toBeNull();
  });

  it('bypasses auth behavior when skip interceptor context is set', () => {
    authState.setAccessToken('active-token');
    let receivedStatus: number | null = null;

    httpClient
      .get('/api/v1/protected', {
        context: new HttpContext().set(authInterceptorContext.skipAuthInterceptor, true),
      })
      .subscribe({
        error: (error: { status: number }) => {
          receivedStatus = error.status;
        },
      });

    const request = httpController.expectOne('/api/v1/protected');
    expect(request.request.headers.has('Authorization')).toBe(false);

    request.flush(
      {
        message: 'Unauthorized',
      },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    httpController.expectNone('/api/v1/auth/refresh');
    expect(receivedStatus).toBe(401);
    expect(authState.accessToken()).toBe('active-token');
  });
});
