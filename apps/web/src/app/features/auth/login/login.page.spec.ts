import type { AccessTokenResponse } from '@fullstack-starter/contracts';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let authApi: { login: ReturnType<typeof vi.fn> };
  let fixture: ReturnType<typeof TestBed.createComponent<LoginPage>>;
  let page: LoginPage;
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authApi = {
      login: vi.fn(),
    };
    router = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: AuthApiService, useValue: authApi as unknown as AuthApiService },
        { provide: Router, useValue: router as unknown as Router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    page = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(page).toBeTruthy();
  });

  it('keeps submit disabled until the form is valid', () => {
    const submitButton = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);

    page.loginForm.setValue({
      email: 'user@example.com',
      password: 'Password123!',
    });
    fixture.detectChanges();

    expect(submitButton.disabled).toBe(false);
  });

  it('does not call login when the form is invalid', () => {
    page.onSubmit();

    expect(authApi.login).not.toHaveBeenCalled();
    expect(page.emailControl.touched).toBe(true);
    expect(page.passwordControl.touched).toBe(true);
  });

  it('submits credentials and navigates to root on success', () => {
    authApi.login.mockReturnValue(of({ accessToken: 'token' }));
    page.loginForm.setValue({
      email: 'user@example.com',
      password: 'Password123!',
    });

    page.onSubmit();

    expect(authApi.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Password123!',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    expect(page.errorMessage()).toBeNull();
    expect(page.isSubmitting()).toBe(false);
  });

  it('shows a generic error when login fails', () => {
    authApi.login.mockReturnValue(
      throwError(() => new Error('Unauthorized')),
    );
    page.loginForm.setValue({
      email: 'user@example.com',
      password: 'WrongPassword123!',
    });

    page.onSubmit();
    fixture.detectChanges();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(page.errorMessage()).toBe(
      'Login failed. Please check your credentials and try again.',
    );
    expect(fixture.nativeElement.querySelector('[data-testid="login-error"]')).toBeTruthy();
  });

  it('shows loading state while login request is in flight', () => {
    const loginSubject = new Subject<AccessTokenResponse>();
    authApi.login.mockReturnValue(loginSubject.asObservable());
    page.loginForm.setValue({
      email: 'user@example.com',
      password: 'Password123!',
    });

    page.onSubmit();
    fixture.detectChanges();

    expect(page.isSubmitting()).toBe(true);
    expect(fixture.nativeElement.querySelector('mat-progress-bar')).toBeTruthy();
    expect(
      (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    loginSubject.next({ accessToken: 'token' });
    loginSubject.complete();
    fixture.detectChanges();

    expect(page.isSubmitting()).toBe(false);
  });
});
