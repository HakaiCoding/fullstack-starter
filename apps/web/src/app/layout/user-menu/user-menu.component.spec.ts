import type { AuthMeResponse } from '@fullstack-starter/contracts';
import { signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { UserMenuComponent } from './user-menu.component';

describe('UserMenuComponent', () => {
  const userResponse: AuthMeResponse = {
    id: 'user-id-1',
    email: 'user@example.com',
    displayName: 'Test User',
    role: 'user',
  };

  let currentUserState: WritableSignal<AuthMeResponse | null>;
  let isAuthenticatedState: WritableSignal<boolean>;
  let authState: {
    currentUser: AuthStateService['currentUser'];
    isAuthenticated: AuthStateService['isAuthenticated'];
    refreshCurrentUser: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(async () => {
    currentUserState = signal<AuthMeResponse | null>(null);
    isAuthenticatedState = signal(false);
    authState = {
      currentUser: currentUserState.asReadonly(),
      isAuthenticated: isAuthenticatedState.asReadonly(),
      refreshCurrentUser: vi.fn(() => of(currentUserState())),
      logout: vi.fn().mockReturnValue(of({ success: true })),
    };

    await TestBed.configureTestingModule({
      imports: [UserMenuComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStateService, useValue: authState as unknown as AuthStateService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  it('renders sign in button while unauthenticated', () => {
    const fixture = TestBed.createComponent(UserMenuComponent);
    fixture.detectChanges();

    const signInButton = fixture.nativeElement.querySelector(
      '[data-testid="sign-in-button"]',
    ) as HTMLButtonElement | null;
    expect(signInButton).toBeTruthy();
    expect(signInButton?.textContent).toContain('Sign in');
    expect(fixture.nativeElement.querySelector('[data-testid="user-menu-trigger"]')).toBeNull();
  });

  it('renders user menu trigger with display name when authenticated', () => {
    isAuthenticatedState.set(true);
    currentUserState.set(userResponse);

    const fixture = TestBed.createComponent(UserMenuComponent);
    fixture.detectChanges();

    const userMenuTrigger = fixture.nativeElement.querySelector(
      '[data-testid="user-menu-trigger"]',
    ) as HTMLButtonElement | null;
    expect(userMenuTrigger).toBeTruthy();
    expect(userMenuTrigger?.textContent).toContain('Test User');
    expect(fixture.nativeElement.querySelector('[data-testid="sign-in-button"]')).toBeNull();
  });

  it('falls back to email when display name is null', () => {
    isAuthenticatedState.set(true);
    currentUserState.set({
      ...userResponse,
      displayName: null,
    });

    const fixture = TestBed.createComponent(UserMenuComponent);
    fixture.detectChanges();

    const userMenuTrigger = fixture.nativeElement.querySelector(
      '[data-testid="user-menu-trigger"]',
    ) as HTMLButtonElement | null;
    expect(userMenuTrigger?.textContent).toContain('user@example.com');
  });

  it('calls logout and navigates to login on sign out success', () => {
    isAuthenticatedState.set(true);
    currentUserState.set(userResponse);

    const fixture = TestBed.createComponent(UserMenuComponent);
    fixture.detectChanges();

    fixture.componentInstance.onSignOut();

    expect(authState.logout).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.isSigningOut()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('does not navigate when sign out fails', () => {
    authState.logout.mockReturnValue(throwError(() => new Error('Logout failed')));
    isAuthenticatedState.set(true);
    currentUserState.set(userResponse);

    const fixture = TestBed.createComponent(UserMenuComponent);
    fixture.detectChanges();

    fixture.componentInstance.onSignOut();

    expect(authState.logout).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.isSigningOut()).toBe(false);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('prevents duplicate sign-out requests while a logout is in flight', () => {
    const logoutSubject = new Subject<{ success: true }>();
    authState.logout.mockReturnValue(logoutSubject.asObservable());
    isAuthenticatedState.set(true);
    currentUserState.set(userResponse);

    const fixture = TestBed.createComponent(UserMenuComponent);
    fixture.detectChanges();

    fixture.componentInstance.onSignOut();
    fixture.componentInstance.onSignOut();

    expect(authState.logout).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.isSigningOut()).toBe(true);

    logoutSubject.next({ success: true });
    logoutSubject.complete();

    expect(fixture.componentInstance.isSigningOut()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
