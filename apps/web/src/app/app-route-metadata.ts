export interface AppRouteMetadata {
  readonly pathSegment: string;
  readonly path: '/' | `/${string}`;
  readonly title: string;
  readonly label: string;
  readonly icon?: string;
  readonly breadcrumbLabel?: string;
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
    breadcrumbLabel: 'Home',
  },
  login: {
    pathSegment: 'login',
    path: '/login',
    title: 'Login',
    label: 'Sign in',
    icon: 'login',
    breadcrumbLabel: 'Login',
  },
  notFound: {
    pathSegment: 'not-found',
    path: '/not-found',
    title: 'Page not found',
    label: 'Not found',
    breadcrumbLabel: 'Not found',
  },
} as const;
