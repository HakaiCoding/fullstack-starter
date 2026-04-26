import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthRefreshService } from './auth-refresh.service';
import { AuthStateService } from './auth-state.service';

describe('AuthRefreshService', () => {
  let service: AuthRefreshService;
  let authState: AuthStateService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthRefreshService);
    authState = TestBed.inject(AuthStateService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('posts refresh request with credentials and updates auth state on success', () => {
    let refreshedToken: string | null = null;

    service.refreshAccessToken().subscribe((token) => {
      refreshedToken = token;
    });

    const refreshRequest = httpController.expectOne('/api/v1/auth/refresh');
    expect(refreshRequest.request.method).toBe('POST');
    expect(refreshRequest.request.withCredentials).toBe(true);

    refreshRequest.flush({ accessToken: 'refreshed-token' });

    expect(refreshedToken).toBe('refreshed-token');
    expect(authState.accessToken()).toBe('refreshed-token');
  });

  it('shares one in-flight refresh request across concurrent subscribers', () => {
    const receivedTokens: string[] = [];

    service.refreshAccessToken().subscribe((token) => {
      receivedTokens.push(`first:${token}`);
    });
    service.refreshAccessToken().subscribe((token) => {
      receivedTokens.push(`second:${token}`);
    });

    const refreshRequest = httpController.expectOne('/api/v1/auth/refresh');
    refreshRequest.flush({ accessToken: 'shared-token' });

    expect(receivedTokens).toEqual(['first:shared-token', 'second:shared-token']);
    expect(authState.accessToken()).toBe('shared-token');
  });

  it('resets in-flight state after refresh error so a new refresh can be attempted', () => {
    let firstAttemptStatus: number | null = null;

    service.refreshAccessToken().subscribe({
      error: (error: { status: number }) => {
        firstAttemptStatus = error.status;
      },
    });

    const firstRefreshRequest = httpController.expectOne('/api/v1/auth/refresh');
    firstRefreshRequest.flush(
      {
        message: 'Unauthorized',
      },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    expect(firstAttemptStatus).toBe(401);

    let secondAttemptToken: string | null = null;
    service.refreshAccessToken().subscribe((token) => {
      secondAttemptToken = token;
    });

    const secondRefreshRequest = httpController.expectOne('/api/v1/auth/refresh');
    secondRefreshRequest.flush({ accessToken: 'token-after-retry' });

    expect(secondAttemptToken).toBe('token-after-retry');
    expect(authState.accessToken()).toBe('token-after-retry');
  });

  it('clears auth state via clearAuthState helper', () => {
    authState.setAccessToken('active-token');
    expect(authState.accessToken()).toBe('active-token');

    service.clearAuthState();

    expect(authState.accessToken()).toBeNull();
  });
});
