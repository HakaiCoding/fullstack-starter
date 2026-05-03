import { Route } from '@angular/router';
import {
  APP_ROUTE_METADATA,
  type AppRouteData,
  type AppRouteMetadata,
} from './app-route-metadata';
import { HomePage } from './features/home/home.page';

function createRouteData(routeMetadata: AppRouteMetadata): AppRouteData {
  return { routeMetadata };
}

export const appRoutes: Route[] = [
  {
    path: '',
    children: [
      {
        path: APP_ROUTE_METADATA.home.pathSegment,
        pathMatch: 'full',
        component: HomePage,
        title: APP_ROUTE_METADATA.home.title,
        data: createRouteData(APP_ROUTE_METADATA.home),
      },
      {
        path: APP_ROUTE_METADATA.login.pathSegment,
        loadComponent: () =>
          import('./features/auth/login/login.page').then((m) => m.LoginPage),
        title: APP_ROUTE_METADATA.login.title,
        data: createRouteData(APP_ROUTE_METADATA.login),
      },
      {
        path: APP_ROUTE_METADATA.notFound.pathSegment,
        loadComponent: () =>
          import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
        title: APP_ROUTE_METADATA.notFound.title,
        data: createRouteData(APP_ROUTE_METADATA.notFound),
      },
      {
        path: '**',
        redirectTo: APP_ROUTE_METADATA.notFound.pathSegment,
      },
    ],
  },
];
