import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../db/entities/user.entity';
import { type UserListItem, type UsersListResponse } from './users.types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async listUsers(): Promise<UsersListResponse> {
    const users = await this.usersRepository.find({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
      },
      order: {
        createdAt: 'DESC',
        id: 'ASC',
      },
    });

    const responseItems: UserListItem[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    }));

    return {
      users: responseItems,
    };
  }
}
