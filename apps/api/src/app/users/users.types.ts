import { type UserRole } from '../../db/entities/user.entity';

export interface UserListItem {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
}

export interface UsersListResponse {
  users: UserListItem[];
}
