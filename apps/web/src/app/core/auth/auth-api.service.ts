import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  AccessTokenResponse,
  AuthMeResponse,
  LogoutResponse,
  UsersListResponse,
} from '@fullstack-starter/contracts';
import { tap } from 'rxjs';
import { authInterceptorContext } from './auth.interceptor';
import { AuthStateService } from './auth-state.service';
import { type LoginRequest } from './auth.types';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateService);

  login(body: LoginRequest) {
    return this.http
      .post<AccessTokenResponse>('/api/v1/auth/login', body, {
        withCredentials: true,
        context: this.buildSkipAuthInterceptorContext(),
      })
      .pipe(
        tap((response) => {
          this.authState.setAccessToken(response.accessToken);
        }),
      );
  }

  logout() {
    return this.http
      .post<LogoutResponse>(
        '/api/v1/auth/logout',
        {},
        {
          withCredentials: true,
          context: this.buildSkipAuthInterceptorContext(),
        },
      )
      .pipe(
        tap(() => {
          this.authState.clear();
        }),
      );
  }

  getMe() {
    return this.http.get<AuthMeResponse>('/api/v1/auth/me');
  }

  getUsers() {
    return this.http.get<UsersListResponse>('/api/v1/users');
  }

  private buildSkipAuthInterceptorContext(): HttpContext {
    return new HttpContext().set(authInterceptorContext.skipAuthInterceptor, true);
  }
}
