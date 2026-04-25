export interface AccessTokenResponse {
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LogoutResponse {
  success: true;
}

export type AuthRole = 'admin' | 'user';

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
