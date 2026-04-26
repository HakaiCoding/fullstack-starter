import { UnauthorizedException } from '@nestjs/common';
import { type Repository } from 'typeorm';
import { UserEntity } from '../../../db/entities/user.entity';
import { type AuthConfig } from '../../config/auth.config';
import { JwtAccessStrategy } from './jwt-access.strategy';

const TEST_AUTH_CONFIG: AuthConfig = {
  accessToken: {
    secret: 'access-secret-access-secret-access-secret-123',
    ttlSeconds: 900,
  },
  refreshToken: {
    secret: 'refresh-secret-refresh-secret-refresh-secret-123',
    ttlSeconds: 60 * 60 * 24 * 7,
  },
  refreshCookie: {
    name: 'refresh_token',
    secure: false,
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
  },
};

describe('JwtAccessStrategy', () => {
  let strategy: JwtAccessStrategy;
  let usersRepositoryMock: Pick<Repository<UserEntity>, 'findOne'>;

  beforeEach(() => {
    usersRepositoryMock = {
      findOne: jest.fn(),
    };

    strategy = new JwtAccessStrategy(
      TEST_AUTH_CONFIG,
      usersRepositoryMock as Repository<UserEntity>,
    );
  });

  it('rejects non-access token type payloads', async () => {
    await expect(
      strategy.validate({
        sub: 'f72f2444-f3cd-4836-b176-9b2e63466448',
        tokenType: 'refresh',
        role: 'admin',
      } as never),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects payloads with invalid role values', async () => {
    await expect(
      strategy.validate({
        sub: 'f72f2444-f3cd-4836-b176-9b2e63466448',
        tokenType: 'access',
        role: 'superadmin',
      } as never),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects payloads whose user is not found', async () => {
    usersRepositoryMock.findOne = jest.fn().mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: '9fa61cab-57d0-49fd-a6af-69ec1947be0e',
        tokenType: 'access',
        role: 'user',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('loads persisted user profile and returns request-user shape for valid payloads', async () => {
    usersRepositoryMock.findOne = jest.fn().mockResolvedValue({
      id: '7f17664d-bf4d-4a83-bf34-4ff32df2424b',
      email: 'user@example.com',
      displayName: 'Normal User',
    } as UserEntity);

    const validated = await strategy.validate({
      sub: '7f17664d-bf4d-4a83-bf34-4ff32df2424b',
      tokenType: 'access',
      role: 'user',
    });

    expect(usersRepositoryMock.findOne).toHaveBeenCalledWith({
      where: {
        id: '7f17664d-bf4d-4a83-bf34-4ff32df2424b',
      },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });
    expect(validated).toEqual({
      userId: '7f17664d-bf4d-4a83-bf34-4ff32df2424b',
      email: 'user@example.com',
      displayName: 'Normal User',
      role: 'user',
    });
  });
});
