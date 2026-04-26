import { Route } from '@angular/router';
import { HomePage } from './features/home/home.page';

export const appRoutes: Route[] = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
];
