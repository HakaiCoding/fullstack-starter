import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor, authInterceptorContext } from './auth.interceptor';
import { AuthApiService } from './auth-api.service';
import { AuthStateService } from './auth-state.service';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let authState: AuthStateService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthApiService);
    authState = TestBed.inject(AuthStateService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('posts login with credentials and stores access token in memory state', () => {
    service
      .login({
        email: 'test@example.com',
        password: 'Password123!',
      })
      .subscribe();

    const request = httpController.expectOne('/api/v1/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(
      request.request.context.get(authInterceptorContext.skipAuthInterceptor),
    ).toBe(true);
    expect(request.request.headers.has('Authorization')).toBe(false);

    request.flush({
      accessToken: '  token-from-login  ',
    });

    expect(authState.accessToken()).toBe('token-from-login');
  });

  it('requests auth/me using bearer token from auth state', () => {
    authState.setAccessToken('active-access-token');

    service.getMe().subscribe();

    const request = httpController.expectOne('/api/v1/auth/me');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe(
      'Bearer active-access-token',
    );

    request.flush({
      id: 'user-id-1',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
    });
  });

  it('posts logout with credentials and clears in-memory token state', () => {
    authState.setAccessToken('token-before-logout');

    service.logout().subscribe();

    const request = httpController.expectOne('/api/v1/auth/logout');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(
      request.request.context.get(authInterceptorContext.skipAuthInterceptor),
    ).toBe(true);

    request.flush({
      success: true,
    });

    expect(authState.accessToken()).toBeNull();
  });

  it('requests users list using bearer token from auth state', () => {
    authState.setAccessToken('admin-access-token');

    service.getUsers().subscribe();

    const request = httpController.expectOne('/api/v1/users');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe(
      'Bearer admin-access-token',
    );

    request.flush({
      users: [],
    });
  });
});
