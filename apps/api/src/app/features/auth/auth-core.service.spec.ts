import { createHmac } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type Repository, DataSource } from 'typeorm';
import { AuthSessionEntity } from '../../../db/entities/auth-session.entity';
import { UserEntity } from '../../../db/entities/user.entity';
import { type AuthConfig } from '../../config/auth.config';
import { AuthCoreService } from './auth-core.service';

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

function hashRefreshToken(refreshToken: string): string {
  return createHmac('sha256', TEST_AUTH_CONFIG.refreshToken.secret)
    .update(refreshToken)
    .digest('hex');
}

describe('AuthCoreService', () => {
  let authCoreService: AuthCoreService;
  let usersRepositoryMock: Pick<Repository<UserEntity>, 'findOne'>;
  let authSessionsRepositoryMock: Pick<
    Repository<AuthSessionEntity>,
    'findOne' | 'save'
  >;
  let transactionalSessionRepositoryMock: Pick<
    Repository<AuthSessionEntity>,
    'findOne' | 'save' | 'create'
  >;
  let jwtServiceMock: Pick<JwtService, 'signAsync' | 'verifyAsync'>;
  let dataSourceMock: { transaction: jest.Mock };

  beforeEach(() => {
    usersRepositoryMock = {
      findOne: jest.fn(),
    };
    authSessionsRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    transactionalSessionRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    jwtServiceMock = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };
    dataSourceMock = {
      transaction: jest.fn(async (...args: unknown[]) => {
        const runInTransaction =
          typeof args[0] === 'function'
            ? (args[0] as (entityManager: unknown) => Promise<unknown>)
            : (args[1] as (entityManager: unknown) => Promise<unknown>);

        return runInTransaction({
          getRepository: () => transactionalSessionRepositoryMock,
        });
      }),
    };

    authCoreService = new AuthCoreService(
      TEST_AUTH_CONFIG,
      jwtServiceMock as JwtService,
      dataSourceMock as unknown as DataSource,
      usersRepositoryMock as Repository<UserEntity>,
      authSessionsRepositoryMock as Repository<AuthSessionEntity>,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('hashes and verifies passwords with scrypt format', async () => {
    const hash = await authCoreService.hashPassword('S3curePassw0rd!');

    expect(hash.startsWith('scrypt$')).toBe(true);
    await expect(
      authCoreService.verifyPassword('S3curePassw0rd!', hash),
    ).resolves.toBe(true);
    await expect(
      authCoreService.verifyPassword('wrong-password', hash),
    ).resolves.toBe(false);
  });

  it('rejects empty passwords in hashPassword and returns false for malformed hash values', async () => {
    await expect(authCoreService.hashPassword('   ')).rejects.toThrow(
      'Password must not be empty.',
    );

    await expect(
      authCoreService.verifyPassword('anything', null),
    ).resolves.toBe(false);
    await expect(
      authCoreService.verifyPassword('anything', 'bad-format'),
    ).resolves.toBe(false);
  });

  it('rejects credential issuance when user does not exist', async () => {
    usersRepositoryMock.findOne = jest.fn().mockResolvedValue(null);

    await expect(
      authCoreService.issueTokenPairForCredentials('missing@example.com', 'pw'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects credential issuance when password verification fails', async () => {
    usersRepositoryMock.findOne = jest.fn().mockResolvedValue({
      id: '0e9d8207-1025-4e8a-86b4-ad6f6f4a97d1',
      email: 'user@example.com',
      passwordHash: 'stored-hash',
      role: 'user',
    } as UserEntity);
    jest.spyOn(authCoreService, 'verifyPassword').mockResolvedValue(false);

    await expect(
      authCoreService.issueTokenPairForCredentials('user@example.com', 'pw'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('issues credential token pair and replaces existing session', async () => {
    const user = {
      id: '9a51846a-beb6-47ec-a0c5-a6763be3e520',
      email: 'admin@example.com',
      passwordHash: 'stored-hash',
      role: 'admin',
    } as UserEntity;

    usersRepositoryMock.findOne = jest.fn().mockResolvedValue(user);
    jest.spyOn(authCoreService, 'verifyPassword').mockResolvedValue(true);
    jwtServiceMock.signAsync = jest
      .fn()
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const existingSession = {
      user: { id: user.id } as UserEntity,
      refreshTokenHash: 'old-hash',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      revokedAt: new Date('2026-01-01T00:00:00.000Z'),
    } as AuthSessionEntity;

    transactionalSessionRepositoryMock.findOne = jest
      .fn()
      .mockResolvedValue(existingSession);
    transactionalSessionRepositoryMock.save = jest
      .fn()
      .mockResolvedValue(existingSession);

    const issued = await authCoreService.issueTokenPairForCredentials(
      user.email,
      'correct-password',
    );

    expect(issued).toEqual(
      expect.objectContaining({
        userId: user.id,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    );
    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        sub: user.id,
        tokenType: 'access',
        role: 'admin',
      }),
      expect.objectContaining({
        secret: TEST_AUTH_CONFIG.accessToken.secret,
        expiresIn: TEST_AUTH_CONFIG.accessToken.ttlSeconds,
      }),
    );
    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        sub: user.id,
        tokenType: 'refresh',
        jti: expect.any(String),
      }),
      expect.objectContaining({
        secret: TEST_AUTH_CONFIG.refreshToken.secret,
        expiresIn: TEST_AUTH_CONFIG.refreshToken.ttlSeconds,
      }),
    );
    expect(transactionalSessionRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        refreshTokenHash: hashRefreshToken('refresh-token'),
        revokedAt: null,
      }),
    );
  });

  it('rejects issueTokenPairForUser when persisted user cannot be found', async () => {
    usersRepositoryMock.findOne = jest.fn().mockResolvedValue(null);

    await expect(
      authCoreService.issueTokenPairForUser(
        'a7092b27-7cfd-4acd-b26a-d07497507a1c',
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns unauthorized when refresh token verification fails before rotation', async () => {
    jwtServiceMock.verifyAsync = jest.fn().mockRejectedValue(new Error('bad-token'));

    await expect(authCoreService.rotateRefreshToken('bad-token')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(dataSourceMock.transaction).not.toHaveBeenCalled();
  });

  it('rotates refresh token for an active matching session', async () => {
    const userId = '08a6efba-19a9-486a-bdd4-6fdf937fcf65';
    const oldRefreshToken = 'refresh-old-token';
    const oldRefreshTokenHash = hashRefreshToken(oldRefreshToken);

    jwtServiceMock.verifyAsync = jest.fn().mockResolvedValue({
      sub: userId,
      jti: 'refresh-jti-1',
      tokenType: 'refresh',
    });
    jwtServiceMock.signAsync = jest
      .fn()
      .mockResolvedValueOnce('access-token-next')
      .mockResolvedValueOnce('refresh-token-next');

    const activeSession = {
      user: {
        id: userId,
        role: 'user',
      },
      refreshTokenHash: oldRefreshTokenHash,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    } as AuthSessionEntity;

    transactionalSessionRepositoryMock.findOne = jest
      .fn()
      .mockResolvedValue(activeSession);
    transactionalSessionRepositoryMock.save = jest
      .fn()
      .mockResolvedValue(activeSession);

    const rotated = await authCoreService.rotateRefreshToken(oldRefreshToken);

    expect(rotated).toEqual(
      expect.objectContaining({
        userId,
        accessToken: 'access-token-next',
        refreshToken: 'refresh-token-next',
      }),
    );
    expect(transactionalSessionRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        refreshTokenHash: hashRefreshToken('refresh-token-next'),
        revokedAt: null,
      }),
    );
  });

  it('returns unauthorized when active session is revoked during refresh rotation', async () => {
    const userId = 'f8f99653-7f50-46f5-b862-cfd9e13f862a';
    const refreshToken = 'refresh-revoked-token';

    jwtServiceMock.verifyAsync = jest.fn().mockResolvedValue({
      sub: userId,
      jti: 'refresh-jti-2',
      tokenType: 'refresh',
    });
    transactionalSessionRepositoryMock.findOne = jest.fn().mockResolvedValue({
      user: {
        id: userId,
        role: 'user',
      },
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
    } as AuthSessionEntity);

    await expect(authCoreService.rotateRefreshToken(refreshToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('silently ignores invalidateSessionForRefreshToken when token cannot be verified', async () => {
    jwtServiceMock.verifyAsync = jest.fn().mockRejectedValue(new Error('bad-token'));

    await expect(
      authCoreService.invalidateSessionForRefreshToken('bad-token'),
    ).resolves.toBeUndefined();
    expect(authSessionsRepositoryMock.save).not.toHaveBeenCalled();
  });

  it('revokes matching session during invalidateSessionForRefreshToken', async () => {
    const userId = '2dc1f555-d4f7-4ea0-a619-a2fc8ee99dae';
    const refreshToken = 'refresh-token-to-revoke';
    const session = {
      refreshTokenHash: hashRefreshToken(refreshToken),
      revokedAt: null,
      user: {
        id: userId,
      },
    } as AuthSessionEntity;

    jwtServiceMock.verifyAsync = jest.fn().mockResolvedValue({
      sub: userId,
      jti: 'refresh-jti-3',
      tokenType: 'refresh',
    });
    authSessionsRepositoryMock.findOne = jest.fn().mockResolvedValue(session);
    authSessionsRepositoryMock.save = jest.fn().mockResolvedValue(session);

    await authCoreService.invalidateSessionForRefreshToken(refreshToken);

    expect(authSessionsRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        revokedAt: expect.any(Date),
      }),
    );
  });

  it('revokes active session for user id and skips save when session is absent', async () => {
    const userId = 'a7f95e4c-4077-45f0-955d-90f467d70f6d';
    const activeSession = {
      user: {
        id: userId,
      },
      revokedAt: null,
    } as AuthSessionEntity;

    authSessionsRepositoryMock.findOne = jest
      .fn()
      .mockResolvedValueOnce(activeSession)
      .mockResolvedValueOnce(null);
    authSessionsRepositoryMock.save = jest.fn().mockResolvedValue(activeSession);

    await authCoreService.invalidateSessionForUser(userId);
    await authCoreService.invalidateSessionForUser(userId);

    expect(authSessionsRepositoryMock.save).toHaveBeenCalledTimes(1);
    expect(authSessionsRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        revokedAt: expect.any(Date),
      }),
    );
  });
});
