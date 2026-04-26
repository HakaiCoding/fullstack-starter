import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { AuthMeResponse } from '@fullstack-starter/contracts';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from '../auth/auth-api.service';

@Component({
  selector: 'app-auth-status-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './auth-status.page.html',
  styleUrl: './auth-status.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthStatusPage {
  private readonly authApi = inject(AuthApiService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly currentUser = signal<AuthMeResponse | null>(null);
  readonly initialCheckPending = signal(true);
  readonly loginPending = signal(false);
  readonly logoutPending = signal(false);

  readonly loginErrorMessage = signal<string | null>(null);
  readonly sessionErrorMessage = signal<string | null>(null);
  readonly logoutErrorMessage = signal<string | null>(null);

  constructor() {
    void this.loadCurrentUser();
  }

  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loginPending.set(true);
    this.loginErrorMessage.set(null);
    this.sessionErrorMessage.set(null);

    try {
      await firstValueFrom(this.authApi.login(this.loginForm.getRawValue()));
      this.currentUser.set(await firstValueFrom(this.authApi.getMe()));
      this.loginForm.reset();
    } catch (error) {
      this.currentUser.set(null);
      this.loginErrorMessage.set(this.toLoginErrorMessage(error));
    } finally {
      this.loginPending.set(false);
    }
  }

  async onLogout(): Promise<void> {
    this.logoutPending.set(true);
    this.logoutErrorMessage.set(null);

    try {
      await firstValueFrom(this.authApi.logout());
      this.currentUser.set(null);
    } catch {
      this.logoutErrorMessage.set('Unable to log out right now. Please try again.');
    } finally {
      this.logoutPending.set(false);
    }
  }

  private async loadCurrentUser(): Promise<void> {
    this.initialCheckPending.set(true);
    this.sessionErrorMessage.set(null);

    try {
      this.currentUser.set(await firstValueFrom(this.authApi.getMe()));
    } catch (error) {
      this.currentUser.set(null);
      if (!this.isExpectedUnauthenticatedState(error)) {
        this.sessionErrorMessage.set('Unable to verify your session right now.');
      }
    } finally {
      this.initialCheckPending.set(false);
    }
  }

  private isExpectedUnauthenticatedState(error: unknown): boolean {
    return (
      error instanceof HttpErrorResponse &&
      (error.status === 401 || error.status === 403)
    );
  }

  private toLoginErrorMessage(error: unknown): string {
    if (
      error instanceof HttpErrorResponse &&
      (error.status === 400 || error.status === 401)
    ) {
      return 'Sign-in failed. Check your credentials and try again.';
    }

    return 'Sign-in failed. Please try again.';
  }
}
