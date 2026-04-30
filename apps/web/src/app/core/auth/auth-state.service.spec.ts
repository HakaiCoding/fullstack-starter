import type { AuthMeResponse } from '@fullstack-starter/contracts';
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
  let authApi: { getMe: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authApi = {
      getMe: vi.fn().mockReturnValue(of(currentUserResponse)),
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
