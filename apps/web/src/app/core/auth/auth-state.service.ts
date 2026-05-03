import { Injectable, computed, inject, signal } from '@angular/core';
import type {
  AccessTokenResponse,
  AuthMeResponse,
  LogoutResponse,
} from '@fullstack-starter/contracts';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import type { FrontendApiError } from '../api-error/api-error.types';
import { toFrontendApiError } from '../api-error/api-error.utils';
import { AuthApiService } from './auth-api.service';
import { type LoginRequest } from './auth.types';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly authApi = inject(AuthApiService);
  private readonly accessTokenState = signal<string | null>(null);
  private readonly currentUserState = signal<AuthMeResponse | null>(null);
  private readonly loginApiErrorState = signal<FrontendApiError | null>(null);

  readonly accessToken = this.accessTokenState.asReadonly();
  readonly currentUser = this.currentUserState.asReadonly();
  readonly loginApiError = this.loginApiErrorState.asReadonly();
  readonly loginErrorMessage = computed(
    () => this.loginApiErrorState()?.userMessage ?? null,
  );
  readonly isAuthenticated = computed(() => this.accessTokenState() !== null);

  setAccessToken(accessToken: string): void {
    const normalizedToken = accessToken.trim();
    if (normalizedToken === '') {
      this.clear();
      return;
    }

    this.accessTokenState.set(normalizedToken);
  }

  refreshCurrentUser(): Observable<AuthMeResponse | null> {
    if (!this.isAuthenticated()) {
      this.clearCurrentUser();
      return of(null);
    }

    return this.authApi
      .getMe()
      .pipe(
        tap((currentUser) => {
          this.currentUserState.set(currentUser);
        }),
        catchError(() => {
          this.clearCurrentUser();
          return of<AuthMeResponse | null>(null);
        }),
      );
  }

  logout(): Observable<LogoutResponse> {
    return this.authApi.logout().pipe(
      tap(() => {
        this.clear();
      }),
    );
  }

  login(credentials: LoginRequest): Observable<AccessTokenResponse> {
    this.clearLoginError();

    return this.authApi.login(credentials).pipe(
      tap((response) => {
        this.setAccessToken(response.accessToken);
      }),
      catchError((error: unknown) => {
        this.loginApiErrorState.set(toFrontendApiError(error));
        return throwError(() => error);
      }),
    );
  }

  clearLoginError(): void {
    this.loginApiErrorState.set(null);
  }

  clearCurrentUser(): void {
    this.currentUserState.set(null);
  }

  clear(): void {
    this.accessTokenState.set(null);
    this.clearCurrentUser();
    this.clearLoginError();
  }
}
