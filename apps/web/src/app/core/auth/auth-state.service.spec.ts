import type {
  AccessTokenResponse,
  AuthMeResponse,
  LogoutResponse,
} from '@fullstack-starter/contracts';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthApiService } from './auth-api.service';
import { AuthStateService } from './auth-state.service';

describe('AuthStateService', () => {
  const currentUserResponse: AuthMeResponse = {
    id: 'user-id-1',
    email: 'user@example.com',
    displayName: 'Test User',
    role: 'user',
  };

  let service: AuthStateService;
  let authApi: {
    getMe: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authApi = {
      getMe: vi.fn().mockReturnValue(of(currentUserResponse)),
      login: vi
        .fn()
        .mockReturnValue(of<AccessTokenResponse>({ accessToken: 'active-access-token' })),
      logout: vi.fn().mockReturnValue(of<LogoutResponse>({ success: true })),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApiService, useValue: authApi as unknown as AuthApiService },
      ],
    });
    service = TestBed.inject(AuthStateService);
  });

  it('starts with no access token, no current user, and unauthenticated state', () => {
    expect(service.accessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('stores a normalized access token and marks authenticated', () => {
    service.setAccessToken('  active-access-token  ');

    expect(service.accessToken()).toBe('active-access-token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('clears token when provided token is blank after trim', () => {
    service.setAccessToken('active-access-token');
    expect(service.accessToken()).toBe('active-access-token');

    service.refreshCurrentUser().subscribe();
    expect(service.currentUser()).toEqual(currentUserResponse);

    service.setAccessToken('   ');

    expect(service.accessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('clears token and current user explicitly', () => {
    service.setAccessToken('active-access-token');
    expect(service.isAuthenticated()).toBe(true);

    service.refreshCurrentUser().subscribe();
    expect(service.currentUser()).toEqual(currentUserResponse);

    service.clear();

    expect(service.accessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('refreshes current user when authenticated', () => {
    service.setAccessToken('active-access-token');
    let refreshedUser: AuthMeResponse | null = null;

    service.refreshCurrentUser().subscribe((user) => {
      refreshedUser = user;
    });

    expect(authApi.getMe).toHaveBeenCalledTimes(1);
    expect(refreshedUser).toEqual(currentUserResponse);
    expect(service.currentUser()).toEqual(currentUserResponse);
  });

  it('does not call auth/me when unauthenticated and keeps current user cleared', () => {
    let refreshedUser: AuthMeResponse | null = currentUserResponse;

    service.refreshCurrentUser().subscribe((user) => {
      refreshedUser = user;
    });

    expect(authApi.getMe).not.toHaveBeenCalled();
    expect(refreshedUser).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('clears current user when auth/me refresh fails', () => {
    service.setAccessToken('active-access-token');
    service.refreshCurrentUser().subscribe();
    expect(service.currentUser()).toEqual(currentUserResponse);

    authApi.getMe.mockReturnValueOnce(throwError(() => new Error('Unauthorized')));
    let refreshedUser: AuthMeResponse | null = currentUserResponse;

    service.refreshCurrentUser().subscribe((user) => {
      refreshedUser = user;
    });

    expect(refreshedUser).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('clears auth state on successful logout response', () => {
    service.setAccessToken('active-access-token');
    service.refreshCurrentUser().subscribe();
    expect(service.currentUser()).toEqual(currentUserResponse);

    let response: LogoutResponse | null = null;
    service.logout().subscribe((value) => {
      response = value;
    });

    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ success: true });
    expect(service.accessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('sets access token on successful login response and preserves response shape', () => {
    let response: AccessTokenResponse | null = null;

    service
      .login({
        email: 'user@example.com',
        password: 'Password123!',
      })
      .subscribe((value) => {
        response = value;
      });

    expect(authApi.login).toHaveBeenCalledTimes(1);
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Password123!',
    });
    expect(response).toEqual({ accessToken: 'active-access-token' });
    expect(service.accessToken()).toBe('active-access-token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('keeps auth state unchanged when login fails', () => {
    service.setAccessToken('active-access-token');
    service.refreshCurrentUser().subscribe();
    expect(service.currentUser()).toEqual(currentUserResponse);

    authApi.login.mockReturnValueOnce(throwError(() => new Error('Login failed')));
    let receivedError: Error | null = null;

    service
      .login({
        email: 'user@example.com',
        password: 'WrongPassword123!',
      })
      .subscribe({
        error: (error) => {
          receivedError = error as Error;
        },
      });

    expect(authApi.login).toHaveBeenCalledTimes(1);
    expect(receivedError).toBeInstanceOf(Error);
    expect(service.accessToken()).toBe('active-access-token');
    expect(service.currentUser()).toEqual(currentUserResponse);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('does not clear auth state when logout fails', () => {
    service.setAccessToken('active-access-token');
    authApi.getMe.mockReturnValueOnce(of(currentUserResponse));
    service.refreshCurrentUser().subscribe();
    expect(service.currentUser()).toEqual(currentUserResponse);

    authApi.logout.mockReturnValueOnce(throwError(() => new Error('Logout failed')));
    let receivedError: Error | null = null;

    service.logout().subscribe({
      error: (error) => {
        receivedError = error as Error;
      },
    });

    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(receivedError).toBeInstanceOf(Error);
    expect(service.accessToken()).toBe('active-access-token');
    expect(service.currentUser()).toEqual(currentUserResponse);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('keeps token and current-user state in memory only across service instances', () => {
    service.setAccessToken('active-access-token');
    expect(service.accessToken()).toBe('active-access-token');

    service.refreshCurrentUser().subscribe();
    expect(service.currentUser()).toEqual(currentUserResponse);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApiService, useValue: authApi as unknown as AuthApiService },
      ],
    });
    const freshService = TestBed.inject(AuthStateService);

    expect(freshService.accessToken()).toBeNull();
    expect(freshService.currentUser()).toBeNull();
    expect(freshService.isAuthenticated()).toBe(false);
  });
});
