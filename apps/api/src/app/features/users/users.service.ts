import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, type FindOptionsWhere, Repository } from 'typeorm';
import { UserEntity } from '../../../db/entities/user.entity';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import {
  type UserListItem,
  type UsersListPagination,
  type UsersListResponse,
} from './users.types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async listUsers(query: ListUsersQueryDto): Promise<UsersListResponse> {
    const skip = (query.page - 1) * query.pageSize;
    const createdAtSortDirection = query.sortDir === 'asc' ? 'ASC' : 'DESC';
    const where: FindOptionsWhere<UserEntity> = {};

    if (query.role !== undefined) {
      where.role = query.role;
    }

    if (query.email !== undefined) {
      where.email = ILike(`%${query.email}%`);
    }

    const [users, totalItems] = await this.usersRepository.findAndCount({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
      },
      order: {
        createdAt: createdAtSortDirection,
        id: 'ASC',
      },
      where: Object.keys(where).length > 0 ? where : undefined,
      skip,
      take: query.pageSize,
    });

    const responseItems: UserListItem[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    }));

    const totalPages =
      totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize);
    const pagination: UsersListPagination = {
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1 && totalPages > 0,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
    };

    return {
      users: responseItems,
      pagination,
    };
  }
}
