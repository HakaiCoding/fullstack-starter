import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, type TestingModule } from '@nestjs/testing';
import { type FindOperator, type Repository } from 'typeorm';
import { UserEntity } from '../../../db/entities/user.entity';
import { type ListUsersQueryDto } from './dto/list-users-query.dto';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let testingModule: TestingModule;
  let usersService: UsersService;
  let usersRepositoryMock: Pick<Repository<UserEntity>, 'findAndCount'>;

  const defaultQuery: ListUsersQueryDto = {
    page: 1,
    pageSize: 25,
    sortBy: 'createdAt',
    sortDir: 'desc',
  };

  beforeEach(async () => {
    usersRepositoryMock = {
      findAndCount: jest.fn(),
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
    usersRepositoryMock.findAndCount = jest.fn().mockResolvedValue([
      [
        {
          id: '6fd6fb45-0a71-48d5-8e51-3d902d54df66',
          email: 'admin@example.com',
          displayName: 'Admin User',
          role: 'admin',
          passwordHash: 'secret',
        },
      ] as Partial<UserEntity>[],
      1,
    ]);

    await expect(usersService.listUsers(defaultQuery)).resolves.toEqual({
      users: [
        {
          id: '6fd6fb45-0a71-48d5-8e51-3d902d54df66',
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
  });

  it('queries users with pagination defaults and deterministic tie-break ordering', async () => {
    usersRepositoryMock.findAndCount = jest.fn().mockResolvedValue([[], 0]);

    await usersService.listUsers(defaultQuery);

    expect(usersRepositoryMock.findAndCount).toHaveBeenCalledWith({
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
      skip: 0,
      take: 25,
      where: undefined,
    });
  });

  it('applies exact role filtering while preserving baseline pagination/sort options', async () => {
    usersRepositoryMock.findAndCount = jest.fn().mockResolvedValue([[], 0]);

    await usersService.listUsers({
      ...defaultQuery,
      role: 'admin',
    });

    expect(usersRepositoryMock.findAndCount).toHaveBeenCalledWith({
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
      where: {
        role: 'admin',
      },
      skip: 0,
      take: 25,
    });
  });

  it('applies case-insensitive partial email filtering', async () => {
    usersRepositoryMock.findAndCount = jest.fn().mockResolvedValue([[], 0]);

    await usersService.listUsers({
      ...defaultQuery,
      email: 'ADMIN@EXAMPLE',
    });

    const findCall = (usersRepositoryMock.findAndCount as jest.Mock).mock.calls[0]?.[0] as
      | {
          where?: {
            email?: FindOperator<string>;
          };
        }
      | undefined;
    const emailFilter = findCall?.where?.email;
    const normalizedType =
      (emailFilter as unknown as { _type?: string; type?: string })?._type ??
      (emailFilter as unknown as { _type?: string; type?: string })?.type;
    const normalizedValue =
      (emailFilter as unknown as { _value?: string; value?: string })?._value ??
      (emailFilter as unknown as { _value?: string; value?: string })?.value;

    expect(emailFilter).toBeDefined();
    expect(normalizedType).toBe('ilike');
    expect(normalizedValue).toBe('%ADMIN@EXAMPLE%');
  });

  it('combines role and email filters with AND semantics', async () => {
    usersRepositoryMock.findAndCount = jest.fn().mockResolvedValue([[], 0]);

    await usersService.listUsers({
      ...defaultQuery,
      role: 'user',
      email: 'listed',
    });

    const findCall = (usersRepositoryMock.findAndCount as jest.Mock).mock.calls[0]?.[0] as
      | {
          where?: {
            role?: 'admin' | 'user';
            email?: FindOperator<string>;
          };
        }
      | undefined;
    const where = findCall?.where;
    const roleType =
      (where?.email as unknown as { _type?: string; type?: string })?._type ??
      (where?.email as unknown as { _type?: string; type?: string })?.type;
    const roleValue =
      (where?.email as unknown as { _value?: string; value?: string })?._value ??
      (where?.email as unknown as { _value?: string; value?: string })?.value;

    expect(where).toBeDefined();
    expect(where?.role).toBe('user');
    expect(roleType).toBe('ilike');
    expect(roleValue).toBe('%listed%');
  });

  it('uses asc ordering while keeping id asc deterministic tie-break', async () => {
    usersRepositoryMock.findAndCount = jest.fn().mockResolvedValue([[], 0]);

    await usersService.listUsers({
      ...defaultQuery,
      sortDir: 'asc',
    });

    expect(usersRepositoryMock.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        order: {
          createdAt: 'ASC',
          id: 'ASC',
        },
      }),
    );
  });

  it('returns totalPages=0 and empty page metadata for empty datasets', async () => {
    usersRepositoryMock.findAndCount = jest.fn().mockResolvedValue([[], 0]);

    await expect(usersService.listUsers(defaultQuery)).resolves.toEqual({
      users: [],
      pagination: {
        page: 1,
        pageSize: 25,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        sortBy: 'createdAt',
        sortDir: 'desc',
      },
    });
  });

  it('returns empty users for out-of-range valid pages with consistent metadata', async () => {
    usersRepositoryMock.findAndCount = jest.fn().mockResolvedValue([[], 1]);

    await expect(
      usersService.listUsers({
        ...defaultQuery,
        page: 99,
      }),
    ).resolves.toEqual({
      users: [],
      pagination: {
        page: 99,
        pageSize: 25,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: true,
        sortBy: 'createdAt',
        sortDir: 'desc',
      },
    });
  });
});
