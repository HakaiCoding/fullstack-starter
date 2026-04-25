export type {
  AccessTokenResponse,
  AuthMeResponse,
  AuthRole,
  LogoutResponse,
  UserListItem,
  UsersListResponse,
} from '@fullstack-starter/contracts';

export interface LoginRequest {
  email: string;
  password: string;
}
