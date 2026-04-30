import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  AccessTokenResponse,
  AuthMeResponse,
  LogoutResponse,
  UsersListQuery,
  UsersListResponse,
} from '@fullstack-starter/contracts';
import { authInterceptorContext } from './auth.interceptor';
import { type LoginRequest } from './auth.types';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(body: LoginRequest) {
    return this.http.post<AccessTokenResponse>('/api/v1/auth/login', body, {
      withCredentials: true,
      context: this.buildSkipAuthInterceptorContext(),
    });
  }

  logout() {
    return this.http.post<LogoutResponse>(
      '/api/v1/auth/logout',
      {},
      {
        withCredentials: true,
        context: this.buildSkipAuthInterceptorContext(),
      },
    );
  }

  getMe() {
    return this.http.get<AuthMeResponse>('/api/v1/auth/me');
  }

  getUsers(query?: UsersListQuery) {
    let params = new HttpParams();

    if (query?.page !== undefined) {
      params = params.set('page', String(query.page));
    }
    if (query?.pageSize !== undefined) {
      params = params.set('pageSize', String(query.pageSize));
    }
    if (query?.sortBy !== undefined) {
      params = params.set('sortBy', query.sortBy);
    }
    if (query?.sortDir !== undefined) {
      params = params.set('sortDir', query.sortDir);
    }
    if (query?.role !== undefined) {
      params = params.set('role', query.role);
    }
    if (query?.email !== undefined) {
      params = params.set('email', query.email);
    }

    return this.http.get<UsersListResponse>('/api/v1/users', {
      params,
    });
  }

  private buildSkipAuthInterceptorContext(): HttpContext {
    return new HttpContext().set(authInterceptorContext.skipAuthInterceptor, true);
  }
}
