import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthRefreshService } from './auth-refresh.service';
import { AuthStateService } from './auth-state.service';

const AUTH_RETRY_ATTEMPTED = new HttpContextToken<boolean>(() => false);
const SKIP_AUTH_INTERCEPTOR = new HttpContextToken<boolean>(() => false);

function isRefreshExcludedEndpoint(url: string): boolean {
  return (
    url.includes('/api/v1/auth/login') ||
    url.includes('/api/v1/auth/refresh')
  );
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authState = inject(AuthStateService);
  const authRefresh = inject(AuthRefreshService);

  if (request.context.get(SKIP_AUTH_INTERCEPTOR)) {
    return next(request);
  }

  const accessToken = authState.accessToken();
  const requestWithAccessToken = accessToken
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    : request;

  return next(requestWithAccessToken).pipe(
    catchError((error: unknown) => {
      const shouldAttemptRefresh =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !request.context.get(AUTH_RETRY_ATTEMPTED) &&
        !isRefreshExcludedEndpoint(request.url);

      if (!shouldAttemptRefresh) {
        return throwError(() => error);
      }

      return authRefresh.refreshAccessToken().pipe(
        switchMap((refreshedAccessToken) => {
          const retriedRequest = request.clone({
            context: request.context.set(AUTH_RETRY_ATTEMPTED, true),
            setHeaders: {
              Authorization: `Bearer ${refreshedAccessToken}`,
            },
          });
          return next(retriedRequest);
        }),
        catchError((refreshError: unknown) => {
          authRefresh.clearAuthState();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

export const authInterceptorContext = {
  skipAuthInterceptor: SKIP_AUTH_INTERCEPTOR,
};

