import { provideRouter, Router } from '@angular/router';
import { HomePage } from './features/home/home.page';
import { APP_ROUTE_METADATA } from './app-route-metadata';
import { appRoutes } from './app.routes';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';

describe('appRoutes', () => {
  it('defines a shell route with child routes', () => {
    const rootRoute = appRoutes.find((route) => route.path === '');

    expect(rootRoute?.children?.length).toBeGreaterThan(0);
  });

  it('keeps default child route mapped to HomePage', () => {
    const defaultChildRoute = appRoutes[0]?.children?.find(
      (route) => route.path === '',
    );

    expect(defaultChildRoute?.component).toBe(HomePage);
    expect(defaultChildRoute?.pathMatch).toBe('full');
  });

  it('keeps login route configured', () => {
    const loginRoute = appRoutes[0]?.children?.find(
      (route) => route.path === APP_ROUTE_METADATA.login.pathSegment,
    );

    expect(typeof loginRoute?.loadComponent).toBe('function');
  });

  it('defines explicit not-found route', () => {
    const notFoundRoute = appRoutes[0]?.children?.find(
      (route) => route.path === APP_ROUTE_METADATA.notFound.pathSegment,
    );

    expect(typeof notFoundRoute?.loadComponent).toBe('function');
  });

  it('keeps child wildcard route last and redirects to /not-found', () => {
    const children = appRoutes[0]?.children ?? [];
    const wildcardRoute = children[children.length - 1];

    expect(wildcardRoute?.path).toBe('**');
    expect(wildcardRoute?.redirectTo).toBe(APP_ROUTE_METADATA.notFound.pathSegment);
  });

  it('resolves known routes and redirects unknown route to /not-found', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(appRoutes)],
    });

    const harness = await RouterTestingHarness.create();
    const router = TestBed.inject(Router);

    await harness.navigateByUrl(APP_ROUTE_METADATA.home.path);
    expect(router.url).toBe(APP_ROUTE_METADATA.home.path);
    expect(harness.routeNativeElement?.textContent).toContain('HomePage');

    await harness.navigateByUrl(APP_ROUTE_METADATA.login.path);
    expect(router.url).toBe(APP_ROUTE_METADATA.login.path);
    expect(harness.routeNativeElement?.textContent).toContain('Login');

    await harness.navigateByUrl('/blabla');
    expect(router.url).toBe(APP_ROUTE_METADATA.notFound.path);
    expect(harness.routeNativeElement?.textContent).toContain('Page not found');
  });
});
