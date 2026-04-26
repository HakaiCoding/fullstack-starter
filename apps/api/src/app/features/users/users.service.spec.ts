import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, type TestingModule } from '@nestjs/testing';
import { type Repository } from 'typeorm';
import { UserEntity } from '../../../db/entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let testingModule: TestingModule;
  let usersService: UsersService;
  let usersRepositoryMock: Pick<Repository<UserEntity>, 'find'>;

  beforeEach(async () => {
    usersRepositoryMock = {
      find: jest.fn(),
    };

    testingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: usersRepositoryMock,
        },
      ],
    }).compile();

    usersService = testingModule.get(UsersService);
  });

  it('returns users in the contract shape without sensitive fields', async () => {
    usersRepositoryMock.find = jest.fn().mockResolvedValue([
      {
        id: '6fd6fb45-0a71-48d5-8e51-3d902d54df66',
        email: 'admin@example.com',
        displayName: 'Admin User',
        role: 'admin',
        passwordHash: 'secret',
      },
    ] as Partial<UserEntity>[]);

    await expect(usersService.listUsers()).resolves.toEqual({
      users: [
        {
          id: '6fd6fb45-0a71-48d5-8e51-3d902d54df66',
          email: 'admin@example.com',
          displayName: 'Admin User',
          role: 'admin',
        },
      ],
    });
  });

  it('queries users with deterministic ordering for the list contract', async () => {
    usersRepositoryMock.find = jest.fn().mockResolvedValue([]);

    await usersService.listUsers();

    expect(usersRepositoryMock.find).toHaveBeenCalledWith({
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
  });
});
