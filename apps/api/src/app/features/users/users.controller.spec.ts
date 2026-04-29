import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test, type TestingModule } from '@nestjs/testing';
import { AUTH_ROLES_KEY } from '../auth/roles.decorator';
import { JwtAccessAuthGuard } from '../auth/jwt-access-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { type ListUsersQueryDto } from './dto/list-users-query.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let testingModule: TestingModule;
  let usersController: UsersController;
  const usersServiceMock: Pick<UsersService, 'listUsers'> = {
    listUsers: jest.fn(),
  };

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    usersController = testingModule.get(UsersController);
  });

  it('returns the users list response from service', async () => {
    usersServiceMock.listUsers = jest.fn().mockResolvedValue({
      users: [
        {
          id: '93388fcc-3ef6-4dfe-94ea-f03c803cc8c0',
          email: 'admin@example.com',
          displayName: 'Admin User',
          role: 'admin',
        },
      ],
      pagination: {
        page: 1,
        pageSize: 25,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        sortBy: 'createdAt',
        sortDir: 'desc',
      },
    });

    const query: ListUsersQueryDto = {
      page: 1,
      pageSize: 25,
      sortBy: 'createdAt',
      sortDir: 'desc',
    };
    await expect(usersController.listUsers(query)).resolves.toEqual({
      users: [
        {
          id: '93388fcc-3ef6-4dfe-94ea-f03c803cc8c0',
          email: 'admin@example.com',
          displayName: 'Admin User',
          role: 'admin',
        },
      ],
      pagination: {
        page: 1,
        pageSize: 25,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        sortBy: 'createdAt',
        sortDir: 'desc',
      },
    });
    expect(usersServiceMock.listUsers).toHaveBeenCalledWith(query);
  });

  it('declares admin-only guard metadata on the controller', () => {
    const guardMetadata = Reflect.getMetadata(GUARDS_METADATA, UsersController) as
      | unknown[]
      | undefined;
    const roleMetadata = Reflect.getMetadata(AUTH_ROLES_KEY, UsersController) as
      | unknown
      | undefined;

    expect(guardMetadata).toEqual([JwtAccessAuthGuard, RolesGuard]);
    expect(roleMetadata).toEqual(['admin']);
  });
});
