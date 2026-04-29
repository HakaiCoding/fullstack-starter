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

  it('does not mutate auth state when login fails', () => {
    authState.setAccessToken('token-before-login-failure');
    let receivedStatus: number | null = null;

    service
      .login({
        email: 'test@example.com',
        password: 'WrongPassword123!',
      })
      .subscribe({
        error: (error: { status: number }) => {
          receivedStatus = error.status;
        },
      });

    const request = httpController.expectOne('/api/v1/auth/login');
    request.flush(
      {
        message: 'Unauthorized',
      },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    expect(receivedStatus).toBe(401);
    expect(authState.accessToken()).toBe('token-before-login-failure');
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

  it('keeps auth state unchanged when logout fails', () => {
    authState.setAccessToken('token-before-logout-failure');
    let receivedStatus: number | null = null;

    service.logout().subscribe({
      error: (error: { status: number }) => {
        receivedStatus = error.status;
      },
    });

    const request = httpController.expectOne('/api/v1/auth/logout');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    expect(
      request.request.context.get(authInterceptorContext.skipAuthInterceptor),
    ).toBe(true);

    request.flush(
      {
        message: 'Server error',
      },
      {
        status: 500,
        statusText: 'Server Error',
      },
    );

    expect(receivedStatus).toBe(500);
    expect(authState.accessToken()).toBe('token-before-logout-failure');
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
      pagination: {
        page: 1,
        pageSize: 25,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        sortBy: 'createdAt',
        sortDir: 'desc',
      },
    });
  });

  it('requests users list with accepted pagination/sorting query parameters', () => {
    authState.setAccessToken('admin-access-token');

    service
      .getUsers({
        page: 2,
        pageSize: 100,
        sortBy: 'createdAt',
        sortDir: 'asc',
      })
      .subscribe();

    const request = httpController.expectOne(
      (value) => value.url === '/api/v1/users',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('100');
    expect(request.request.params.get('sortBy')).toBe('createdAt');
    expect(request.request.params.get('sortDir')).toBe('asc');

    request.flush({
      users: [],
      pagination: {
        page: 2,
        pageSize: 100,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: true,
        sortBy: 'createdAt',
        sortDir: 'asc',
      },
    });
  });

  it('requests users list with accepted filtering query parameters', () => {
    authState.setAccessToken('admin-access-token');

    service
      .getUsers({
        role: 'user',
        email: 'example.com',
      })
      .subscribe();

    const request = httpController.expectOne(
      (value) => value.url === '/api/v1/users',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('role')).toBe('user');
    expect(request.request.params.get('email')).toBe('example.com');

    request.flush({
      users: [],
      pagination: {
        page: 1,
        pageSize: 25,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        sortBy: 'createdAt',
        sortDir: 'desc',
      },
    });
  });
});
