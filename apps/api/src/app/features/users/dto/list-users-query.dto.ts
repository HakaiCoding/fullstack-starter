import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import {
  type UsersListQuery,
  type UsersListSortBy,
  type UsersListSortDir,
} from '../users.types';

const USERS_LIST_SORT_BY_VALUES: UsersListSortBy[] = ['createdAt'];
const USERS_LIST_SORT_DIR_VALUES: UsersListSortDir[] = ['asc', 'desc'];
const USERS_LIST_ROLE_VALUES: NonNullable<UsersListQuery['role']>[] = ['admin', 'user'];

export class ListUsersQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 25;

  @IsIn(USERS_LIST_SORT_BY_VALUES)
  sortBy: UsersListSortBy = 'createdAt';

  @IsIn(USERS_LIST_SORT_DIR_VALUES)
  sortDir: UsersListSortDir = 'desc';

  @IsOptional()
  @IsIn(USERS_LIST_ROLE_VALUES)
  role?: NonNullable<UsersListQuery['role']>;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  email?: string;
}
