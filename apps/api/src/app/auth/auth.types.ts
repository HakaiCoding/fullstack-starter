import type { AuthRole } from '@fullstack-starter/contracts';

export type { AuthRole };

export interface AccessTokenPayload {
  sub: string;
  tokenType: 'access';
  role: AuthRole;
}

export interface AuthenticatedRequestUser {
  userId: string;
  email: string;
  displayName: string | null;
  role: AuthRole;
}
