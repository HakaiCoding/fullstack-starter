export type {
  AccessTokenResponse,
  AuthMeResponse,
  AuthRole,
  LogoutResponse,
  UserListItem,
  UsersListQuery,
  UsersListResponse,
  UsersListSortBy,
  UsersListSortDir,
} from '@fullstack-starter/contracts';

export interface LoginRequest {
  email: string;
  password: string;
}
