export interface AppRouteMetadata {
  readonly pathSegment: string;
  readonly path: '/' | `/${string}`;
  readonly title: string;
  readonly label: string;
  readonly icon?: string;
}

export interface AppRouteData {
  readonly routeMetadata: AppRouteMetadata;
}

export type AppRouteKey = 'home' | 'login' | 'notFound';

export const APP_ROUTE_METADATA: Readonly<Record<AppRouteKey, AppRouteMetadata>> = {
  home: {
    pathSegment: '',
    path: '/',
    title: 'Home',
    label: 'Home',
    icon: 'home',
  },
  login: {
    pathSegment: 'login',
    path: '/login',
    title: 'Login',
    label: 'Sign in',
    icon: 'login',
  },
  notFound: {
    pathSegment: 'not-found',
    path: '/not-found',
    title: 'Page not found',
    label: 'Not found',
  },
} as const;
