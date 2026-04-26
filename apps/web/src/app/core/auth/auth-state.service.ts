import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly accessTokenState = signal<string | null>(null);

  readonly accessToken = this.accessTokenState.asReadonly();
  readonly isAuthenticated = computed(() => this.accessTokenState() !== null);

  setAccessToken(accessToken: string): void {
    const normalizedToken = accessToken.trim();
    if (normalizedToken === '') {
      this.clear();
      return;
    }

    this.accessTokenState.set(normalizedToken);
  }

  clear(): void {
    this.accessTokenState.set(null);
  }
}

