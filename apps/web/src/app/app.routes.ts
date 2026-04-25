import { Route } from '@angular/router';
import { AuthWorkbenchPage } from './auth-workbench/auth-workbench.page';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth-workbench',
  },
  {
    path: 'auth-workbench',
    component: AuthWorkbenchPage,
  },
];
