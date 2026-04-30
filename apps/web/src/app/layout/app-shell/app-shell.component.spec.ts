import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { APP_ROUTE_METADATA } from '../../app-route-metadata';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { AppShellComponent } from './app-shell.component';

@Component({
  template: '<p>Test route page</p>',
})
class TestRoutePage {}

describe('AppShellComponent', () => {
  beforeEach(async () => {
    const currentUserState = signal(null);
    const isAuthenticatedState = signal(false);
    const authState = {
      currentUser: currentUserState.asReadonly(),
      isAuthenticated: isAuthenticatedState.asReadonly(),
      refreshCurrentUser: () => of(null),
      logout: () => of({ success: true }),
    };

    await TestBed.configureTestingModule({
      imports: [AppShellComponent, TestRoutePage],
      providers: [
        provideRouter([
          {
            path: APP_ROUTE_METADATA.home.pathSegment,
            pathMatch: 'full',
            component: TestRoutePage,
            title: APP_ROUTE_METADATA.home.title,
            data: { routeMetadata: APP_ROUTE_METADATA.home },
          },
          {
            path: APP_ROUTE_METADATA.login.pathSegment,
            component: TestRoutePage,
            title: APP_ROUTE_METADATA.login.title,
            data: { routeMetadata: APP_ROUTE_METADATA.login },
          },
        ]),
        {
          provide: AuthStateService,
          useValue: authState as unknown as AuthStateService,
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders active route metadata title in the toolbar', async () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    const router = TestBed.inject(Router);

    await router.navigateByUrl(APP_ROUTE_METADATA.home.path);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.app-toolbar-title')?.textContent).toContain(
      APP_ROUTE_METADATA.home.title,
    );

    await router.navigateByUrl(APP_ROUTE_METADATA.login.path);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.app-toolbar-title')?.textContent).toContain(
      APP_ROUTE_METADATA.login.title,
    );
  });
});
