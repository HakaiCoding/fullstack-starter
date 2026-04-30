import { Route } from '@angular/router';
import { APP_ROUTE_METADATA, type AppRouteData } from './app-route-metadata';
import { HomePage } from './features/home/home.page';

const withRouteData = (routeMetadata: AppRouteData['routeMetadata']): AppRouteData => ({
  routeMetadata,
});

export const appRoutes: Route[] = [
  {
    path: '',
    children: [
      {
        path: APP_ROUTE_METADATA.home.pathSegment,
        pathMatch: 'full',
        component: HomePage,
        data: withRouteData(APP_ROUTE_METADATA.home),
      },
      {
        path: APP_ROUTE_METADATA.login.pathSegment,
        loadComponent: () =>
          import('./features/auth/login/login.page').then((m) => m.LoginPage),
        data: withRouteData(APP_ROUTE_METADATA.login),
      },
      {
        path: APP_ROUTE_METADATA.notFound.pathSegment,
        loadComponent: () =>
          import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
        data: withRouteData(APP_ROUTE_METADATA.notFound),
      },
      {
        path: '**',
        redirectTo: APP_ROUTE_METADATA.notFound.pathSegment,
      },
    ],
  },
];
