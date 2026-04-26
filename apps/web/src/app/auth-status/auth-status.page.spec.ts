import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthApiService } from '../auth/auth-api.service';
import { AuthStatusPage } from './auth-status.page';

describe('AuthStatusPage', () => {
  let authApi: {
    login: AuthApiService['login'];
    logout: AuthApiService['logout'];
    getMe: AuthApiService['getMe'];
    getUsers: AuthApiService['getUsers'];
  };

  const authenticatedUser = {
    id: 'user-id-1',
    email: 'user@example.com',
    displayName: 'Test User',
    role: 'user' as const,
  };

  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [AuthStatusPage],
      providers: [{ provide: AuthApiService, useValue: authApi }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AuthStatusPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return fixture;
  }

  beforeEach(() => {
    authApi = {
      login: () => of({ accessToken: 'access-token' }),
      logout: () => of({ success: true }),
      getMe: () => of(authenticatedUser),
      getUsers: () => of({ users: [] }),
    };
  });

  it('renders the login form when no authenticated session is found', async () => {
    authApi.getMe = () => throwError(() => new HttpErrorResponse({ status: 401 }));

    const fixture = await createComponent();

    expect(
      fixture.nativeElement.querySelector('[data-testid="auth-login-form"]'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[data-testid="auth-user-card"]'),
    ).toBeNull();
  });

  it('renders the user card when session validation succeeds', async () => {
    authApi.getMe = () => of(authenticatedUser);

    const fixture = await createComponent();

    expect(
      fixture.nativeElement.querySelector('[data-testid="auth-user-card"]'),
    ).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('user@example.com');
  });
});
