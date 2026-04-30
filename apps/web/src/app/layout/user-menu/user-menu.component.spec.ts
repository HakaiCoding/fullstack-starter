import type { AuthMeResponse } from '@fullstack-starter/contracts';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthApiService } from '../../core/auth/auth-api.service';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { UserMenuComponent } from './user-menu.component';

describe('UserMenuComponent', () => {
  const userResponse: AuthMeResponse = {
    id: 'user-id-1',
    email: 'user@example.com',
    displayName: 'Test User',
    role: 'user',
  };

  let authApi: { getMe: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
  let authState: AuthStateService;
  let router: Router;

  beforeEach(async () => {
    authApi = {
      getMe: vi.fn().mockReturnValue(of(userResponse)),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UserMenuComponent],
      providers: [
        provideRouter([]),
        { provide: AuthApiService, useValue: authApi as unknown as AuthApiService },
      ],
    }).compileComponents();

    authState = TestBed.inject(AuthStateService);
    router = TestBed.inject(Router);
    authApi.logout.mockImplementation(() => {
      authState.clear();
      return of({ success: true });
    });
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  it('renders sign in button while unauthenticated', () => {
    const fixture = TestBed.createComponent(UserMenuComponent);
    fixture.detectChanges();

    expect(authApi.getMe).not.toHaveBeenCalled();

    const signInButton = fixture.nativeElement.querySelector(
      '[data-testid="sign-in-button"]',
    ) as HTMLButtonElement | null;
    expect(signInButton).toBeTruthy();
    expect(signInButton?.textContent).toContain('Sign in');
    expect(fixture.nativeElement.querySelector('[data-testid="user-menu-trigger"]')).toBeNull();
  });

  it('renders user menu trigger with display name when authenticated', () => {
    authState.setAccessToken('active-access-token');

    const fixture = TestBed.createComponent(UserMenuComponent);
    fixture.detectChanges();

    expect(authApi.getMe).toHaveBeenCalledTimes(1);
    expect(authState.currentUser()).toEqual(userResponse);

    const userMenuTrigger = fixture.nativeElement.querySelector(
      '[data-testid="user-menu-trigger"]',
    ) as HTMLButtonElement | null;
    expect(userMenuTrigger).toBeTruthy();
    expect(userMenuTrigger?.textContent).toContain('Test User');
    expect(fixture.nativeElement.querySelector('[data-testid="sign-in-button"]')).toBeNull();
  });

  it('falls back to email when display name is null', () => {
    authApi.getMe.mockReturnValue(
      of({
        ...userResponse,
        displayName: null,
      }),
    );
    authState.setAccessToken('active-access-token');

    const fixture = TestBed.createComponent(UserMenuComponent);
    fixture.detectChanges();

    const userMenuTrigger = fixture.nativeElement.querySelector(
      '[data-testid="user-menu-trigger"]',
    ) as HTMLButtonElement | null;
    expect(userMenuTrigger?.textContent).toContain('user@example.com');
  });

  it('calls logout and navigates to login on sign out success', () => {
    authState.setAccessToken('active-access-token');

    const fixture = TestBed.createComponent(UserMenuComponent);
    fixture.detectChanges();
    expect(authState.currentUser()).toEqual(userResponse);

    fixture.componentInstance.onSignOut();

    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(authState.accessToken()).toBeNull();
    expect(authState.currentUser()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('does not navigate when sign out fails', () => {
    authApi.logout.mockReturnValue(throwError(() => new Error('Logout failed')));
    authState.setAccessToken('active-access-token');

    const fixture = TestBed.createComponent(UserMenuComponent);
    fixture.detectChanges();

    fixture.componentInstance.onSignOut();

    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
