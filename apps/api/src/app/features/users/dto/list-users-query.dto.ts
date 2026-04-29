import { Type } from 'class-transformer';
import { IsIn, IsInt, Min, Max } from 'class-validator';
import { type UsersListSortBy, type UsersListSortDir } from '../users.types';

const USERS_LIST_SORT_BY_VALUES: UsersListSortBy[] = ['createdAt'];
const USERS_LIST_SORT_DIR_VALUES: UsersListSortDir[] = ['asc', 'desc'];

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
}
