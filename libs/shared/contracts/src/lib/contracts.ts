export type AuthRole = 'admin' | 'user';

export type ApiErrorCode =
  | 'REQUEST_VALIDATION_FAILED'
  | 'REQUEST_UNKNOWN_FIELD'
  | 'REQUEST_MALFORMED_JSON'
  | 'AUTH_UNAUTHENTICATED'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_INVALID_OR_EXPIRED_TOKEN'
  | 'AUTH_FORBIDDEN';

export interface ApiErrorResponse {
  statusCode: 400 | 401 | 403;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: string[];
  };
}

export interface AccessTokenResponse {
  accessToken: string;
}

export interface LogoutResponse {
  success: true;
}

export interface AuthMeResponse {
  id: string;
  email: string;
  displayName: string | null;
  role: AuthRole;
}

export interface UserListItem {
  id: string;
  email: string;
  displayName: string | null;
  role: AuthRole;
}

export interface UsersListResponse {
  users: UserListItem[];
}
