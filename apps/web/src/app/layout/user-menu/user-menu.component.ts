import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import type { AuthMeResponse } from '@fullstack-starter/contracts';
import { Router, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, finalize, of, switchMap } from 'rxjs';
import { AuthApiService } from '../../core/auth/auth-api.service';
import { AuthStateService } from '../../core/auth/auth-state.service';

@Component({
  selector: 'app-user-menu',
  imports: [MatButtonModule, MatChipsModule, MatIconModule, MatMenuModule, RouterLink],
  templateUrl: './user-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly currentUser = signal<AuthMeResponse | null>(null);
  readonly isAuthenticated = this.authState.isAuthenticated;
  readonly isSigningOut = signal(false);
  readonly userPrimaryLabel = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return null;
    }

    const displayName = user.displayName?.trim();
    if (displayName) {
      return displayName;
    }

    return user.email;
  });

  constructor() {
    toObservable(this.isAuthenticated)
      .pipe(
        distinctUntilChanged(),
        switchMap((isAuthenticated) => {
          if (!isAuthenticated) {
            return of<AuthMeResponse | null>(null);
          }

          return this.authApi.getMe().pipe(
            catchError(() => of<AuthMeResponse | null>(null)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((user) => {
        this.currentUser.set(user);
      });
  }

  onSignOut(): void {
    if (this.isSigningOut()) {
      return;
    }

    this.isSigningOut.set(true);

    this.authApi
      .logout()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSigningOut.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.currentUser.set(null);
          void this.router.navigateByUrl('/login');
        },
        error: () => {
          // Keep existing logout/auth-state semantics on error.
        },
      });
  }
}
