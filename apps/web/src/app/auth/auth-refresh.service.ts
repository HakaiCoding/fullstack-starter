import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, finalize, map, shareReplay, tap } from 'rxjs';
import { AuthStateService } from './auth-state.service';
import { type AccessTokenResponse } from './auth.types';

@Injectable({ providedIn: 'root' })
export class AuthRefreshService {
  private readonly authState = inject(AuthStateService);
  private readonly rawHttpClient = new HttpClient(inject(HttpBackend));

  private refreshInFlight$: Observable<string> | null = null;

  refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.refreshInFlight$ = this.rawHttpClient
      .post<AccessTokenResponse>(
        '/api/v1/auth/refresh',
        {},
        { withCredentials: true },
      )
      .pipe(
        map((response) => response.accessToken),
        tap((accessToken) => {
          this.authState.setAccessToken(accessToken);
        }),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.refreshInFlight$;
  }

  clearAuthState(): void {
    this.authState.clear();
  }
}

