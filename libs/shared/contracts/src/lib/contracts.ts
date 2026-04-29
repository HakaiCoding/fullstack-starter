export type AuthRole = 'admin' | 'user';

export type ApiErrorCode =
  | 'REQUEST_VALIDATION_FAILED'
  | 'REQUEST_UNKNOWN_FIELD'
  | 'REQUEST_MALFORMED_JSON'
  | 'AUTH_UNAUTHENTICATED'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_INVALID_OR_EXPIRED_TOKEN'
  | 'AUTH_FORBIDDEN'
  | 'RESOURCE_NOT_FOUND'
  | 'RESOURCE_CONFLICT'
  | 'INTERNAL_SERVER_ERROR';

export interface ApiErrorResponse {
  statusCode: 400 | 401 | 403 | 404 | 409 | 500;
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

export type UsersListSortBy = 'createdAt';
export type UsersListSortDir = 'asc' | 'desc';

export interface UsersListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: UsersListSortBy;
  sortDir?: UsersListSortDir;
  role?: AuthRole;
  email?: string;
}

export interface UsersListPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  sortBy: UsersListSortBy;
  sortDir: UsersListSortDir;
}

export interface UsersListResponse {
  users: UserListItem[];
  pagination: UsersListPagination;
}
