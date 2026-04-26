import { Route } from '@angular/router';
import { AuthStatusPage } from './auth-status/auth-status.page';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth-status',
  },
  {
    path: 'auth-status',
    component: AuthStatusPage,
  },
];
