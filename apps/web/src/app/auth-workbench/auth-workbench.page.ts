import { JsonPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { AuthMeResponse, UsersListResponse } from '@fullstack-starter/contracts';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from '../auth/auth-api.service';
import { AuthStateService } from '../auth/auth-state.service';

interface HttpFailure {
  status: number | null;
  message: string;
  body: unknown;
}

@Component({
  selector: 'app-auth-workbench-page',
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatToolbarModule,
  ],
  templateUrl: './auth-workbench.page.html',
  styleUrl: './auth-workbench.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthWorkbenchPage {
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly isAuthenticated = this.authState.isAuthenticated;
  readonly hasAccessToken = computed(() => this.authState.accessToken() !== null);

  readonly loginPending = signal(false);
  readonly mePending = signal(false);
  readonly usersPending = signal(false);
  readonly logoutPending = signal(false);

  readonly loginFailure = signal<HttpFailure | null>(null);
  readonly meResult = signal<AuthMeResponse | null>(null);
  readonly meFailure = signal<HttpFailure | null>(null);
  readonly usersResult = signal<UsersListResponse | null>(null);
  readonly usersFailure = signal<HttpFailure | null>(null);
  readonly logoutFailure = signal<HttpFailure | null>(null);

  readonly usersRbacDenied = computed(() => {
    const failure = this.usersFailure();
    return failure?.status === 401 || failure?.status === 403;
  });

  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loginPending.set(true);
    this.loginFailure.set(null);
    try {
      await firstValueFrom(this.authApi.login(this.loginForm.getRawValue()));
      this.snackBar.open('Login succeeded.', 'Dismiss', { duration: 2500 });
    } catch (error) {
      this.loginFailure.set(this.toHttpFailure(error));
    } finally {
      this.loginPending.set(false);
    }
  }

  async onLoadMe(): Promise<void> {
    this.mePending.set(true);
    this.meFailure.set(null);
    try {
      this.meResult.set(await firstValueFrom(this.authApi.getMe()));
    } catch (error) {
      this.meResult.set(null);
      this.meFailure.set(this.toHttpFailure(error));
    } finally {
      this.mePending.set(false);
    }
  }

  async onLoadUsers(): Promise<void> {
    this.usersPending.set(true);
    this.usersFailure.set(null);
    try {
      this.usersResult.set(await firstValueFrom(this.authApi.getUsers()));
    } catch (error) {
      this.usersResult.set(null);
      this.usersFailure.set(this.toHttpFailure(error));
    } finally {
      this.usersPending.set(false);
    }
  }

  async onLogout(): Promise<void> {
    this.logoutPending.set(true);
    this.logoutFailure.set(null);
    try {
      await firstValueFrom(this.authApi.logout());
      this.meResult.set(null);
      this.meFailure.set(null);
      this.usersResult.set(null);
      this.usersFailure.set(null);
      this.snackBar.open('Logged out.', 'Dismiss', { duration: 2500 });
    } catch (error) {
      this.logoutFailure.set(this.toHttpFailure(error));
    } finally {
      this.logoutPending.set(false);
    }
  }

  private toHttpFailure(error: unknown): HttpFailure {
    if (error instanceof HttpErrorResponse) {
      return {
        status: error.status || null,
        message: error.message,
        body: error.error ?? null,
      };
    }

    return {
      status: null,
      message: 'Unexpected client error.',
      body: null,
    };
  }
}
