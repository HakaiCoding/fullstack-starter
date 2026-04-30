import { Injectable, computed, inject, signal } from '@angular/core';
import type {
  AccessTokenResponse,
  AuthMeResponse,
  LogoutResponse,
} from '@fullstack-starter/contracts';
import { Observable, catchError, of, tap } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { type LoginRequest } from './auth.types';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly authApi = inject(AuthApiService);
  private readonly accessTokenState = signal<string | null>(null);
  private readonly currentUserState = signal<AuthMeResponse | null>(null);

  readonly accessToken = this.accessTokenState.asReadonly();
  readonly currentUser = this.currentUserState.asReadonly();
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
    return this.authApi.login(credentials).pipe(
      tap((response) => {
        this.setAccessToken(response.accessToken);
      }),
    );
  }

  clearCurrentUser(): void {
    this.currentUserState.set(null);
  }

  clear(): void {
    this.accessTokenState.set(null);
    this.clearCurrentUser();
  }
}
