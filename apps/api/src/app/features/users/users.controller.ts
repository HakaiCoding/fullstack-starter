import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAccessAuthGuard } from '../auth/jwt-access-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UsersService } from './users.service';
import { type UsersListResponse } from './users.types';

@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(JwtAccessAuthGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listUsers(@Query() query: ListUsersQueryDto): Promise<UsersListResponse> {
    return this.usersService.listUsers(query);
  }
}
