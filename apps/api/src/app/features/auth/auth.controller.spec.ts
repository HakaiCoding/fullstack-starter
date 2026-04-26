import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { type Request, type Response } from 'express';
import { type AuthConfig } from '../../config/auth.config';
import { type AuthenticatedRequestUser } from './auth.types';
import { AuthController } from './auth.controller';
import { type AuthCoreService } from './auth-core.service';

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

function createResponseMock(): Pick<Response, 'cookie' | 'clearCookie'> {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };
}

describe('AuthController', () => {
  let controller: AuthController;
  let authCoreServiceMock: Pick<
    AuthCoreService,
    | 'issueTokenPairForCredentials'
    | 'rotateRefreshToken'
    | 'invalidateSessionForRefreshToken'
  >;

  beforeEach(() => {
    authCoreServiceMock = {
      issueTokenPairForCredentials: jest.fn(),
      rotateRefreshToken: jest.fn(),
      invalidateSessionForRefreshToken: jest.fn(),
    };

    controller = new AuthController(
      authCoreServiceMock as AuthCoreService,
      TEST_AUTH_CONFIG,
    );
  });

  it('logs in with trimmed credentials and sets refresh cookie', async () => {
    const expiresAt = new Date('2026-05-01T12:00:00.000Z');
    authCoreServiceMock.issueTokenPairForCredentials = jest.fn().mockResolvedValue({
      userId: '6e6afba2-cf0e-4203-a91f-3f98eec620de',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshTokenExpiresAt: expiresAt,
    });
    const response = createResponseMock();

    const result = await controller.login(
      {
        email: '  admin@example.com  ',
        password: '  S3curePassw0rd!  ',
      },
      response as Response,
    );

    expect(authCoreServiceMock.issueTokenPairForCredentials).toHaveBeenCalledWith(
      'admin@example.com',
      'S3curePassw0rd!',
    );
    expect(response.cookie).toHaveBeenCalledWith(
      TEST_AUTH_CONFIG.refreshCookie.name,
      'refresh-token',
      expect.objectContaining({
        expires: expiresAt,
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      }),
    );
    expect(result).toEqual({
      accessToken: 'access-token',
    });
  });

  it('rejects login when email or password input is invalid', async () => {
    const response = createResponseMock();

    await expect(
      controller.login(
        {
          email: undefined,
          password: 'pw',
        },
        response as Response,
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      controller.login(
        {
          email: 'admin@example.com',
          password: '   ',
        },
        response as Response,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('refreshes access token with cookie token and resets refresh cookie', async () => {
    const expiresAt = new Date('2026-05-01T13:00:00.000Z');
    authCoreServiceMock.rotateRefreshToken = jest.fn().mockResolvedValue({
      userId: 'ab7996c1-b94f-4605-b5d2-851050b89fb4',
      accessToken: 'access-token-next',
      refreshToken: 'refresh-token-next',
      refreshTokenExpiresAt: expiresAt,
    });
    const response = createResponseMock();

    const result = await controller.refresh(
      {
        headers: {
          cookie: `foo=bar; ${TEST_AUTH_CONFIG.refreshCookie.name}=${encodeURIComponent('refresh token raw')}`,
        },
      } as Request,
      response as Response,
    );

    expect(authCoreServiceMock.rotateRefreshToken).toHaveBeenCalledWith(
      'refresh token raw',
    );
    expect(response.cookie).toHaveBeenCalledWith(
      TEST_AUTH_CONFIG.refreshCookie.name,
      'refresh-token-next',
      expect.objectContaining({
        expires: expiresAt,
      }),
    );
    expect(result).toEqual({
      accessToken: 'access-token-next',
    });
  });

  it('rejects refresh when refresh cookie is missing', async () => {
    const response = createResponseMock();

    await expect(
      controller.refresh({ headers: {} } as Request, response as Response),
    ).rejects.toThrow(UnauthorizedException);
    expect(authCoreServiceMock.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('logs out and clears cookie even when no refresh cookie is present', async () => {
    const response = createResponseMock();

    const result = await controller.logout(
      {
        headers: {},
      } as Request,
      response as Response,
    );

    expect(authCoreServiceMock.invalidateSessionForRefreshToken).not.toHaveBeenCalled();
    expect(response.clearCookie).toHaveBeenCalledWith(
      TEST_AUTH_CONFIG.refreshCookie.name,
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      }),
    );
    expect(result).toEqual({
      success: true,
    });
  });

  it('logs out and invalidates session when refresh cookie is present', async () => {
    authCoreServiceMock.invalidateSessionForRefreshToken = jest.fn();
    const response = createResponseMock();

    await controller.logout(
      {
        headers: {
          cookie: `${TEST_AUTH_CONFIG.refreshCookie.name}=refresh-token`,
        },
      } as Request,
      response as Response,
    );

    expect(authCoreServiceMock.invalidateSessionForRefreshToken).toHaveBeenCalledWith(
      'refresh-token',
    );
  });

  it('maps authenticated request user in getMe response', () => {
    const user: AuthenticatedRequestUser = {
      userId: 'c2f2574a-384f-4f13-a9aa-83ec38ea4cb8',
      email: 'admin@example.com',
      displayName: 'Admin User',
      role: 'admin',
    };

    const result = controller.getMe({
      user,
    } as Request & { user: AuthenticatedRequestUser });

    expect(result).toEqual({
      id: user.userId,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    });
  });
});
