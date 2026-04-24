import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { type Request, type Response, type CookieOptions } from 'express';
import { type AuthConfig, authConfig } from '../config/auth.config';
import { AuthCoreService } from './auth-core.service';
import { type AuthenticatedRequestUser } from './auth.types';
import { JwtAccessAuthGuard } from './jwt-access-auth.guard';

interface LoginRequestBody {
  email?: unknown;
  password?: unknown;
}

interface AccessTokenResponse {
  accessToken: string;
}

interface LogoutResponse {
  success: true;
}

interface AuthMeResponse {
  id: string;
  email: string;
  displayName: string | null;
  role: 'admin' | 'user';
}

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authCoreService: AuthCoreService,
    @Inject(authConfig.KEY)
    private readonly authConfiguration: AuthConfig,
  ) {}

  @Post('login')
  async login(
    @Body() body: LoginRequestBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponse> {
    const email = this.readRequiredString(body.email, 'email');
    const password = this.readRequiredString(body.password, 'password');

    const tokenPair = await this.authCoreService.issueTokenPairForCredentials(
      email,
      password,
    );

    this.setRefreshCookie(
      response,
      tokenPair.refreshToken,
      tokenPair.refreshTokenExpiresAt,
    );

    return {
      accessToken: tokenPair.accessToken,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponse> {
    const refreshToken = this.getRefreshTokenFromRequest(request);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token.');
    }

    const tokenPair = await this.authCoreService.rotateRefreshToken(refreshToken);
    this.setRefreshCookie(
      response,
      tokenPair.refreshToken,
      tokenPair.refreshTokenExpiresAt,
    );

    return {
      accessToken: tokenPair.accessToken,
    };
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LogoutResponse> {
    const refreshToken = this.getRefreshTokenFromRequest(request);
    if (refreshToken) {
      await this.authCoreService.invalidateSessionForRefreshToken(refreshToken);
    }

    response.clearCookie(
      this.authConfiguration.refreshCookie.name,
      this.getRefreshCookieBaseOptions(),
    );

    return {
      success: true,
    };
  }

  @UseGuards(JwtAccessAuthGuard)
  @Get('me')
  getMe(@Req() request: Request & { user: AuthenticatedRequestUser }): AuthMeResponse {
    return {
      id: request.user.userId,
      email: request.user.email,
      displayName: request.user.displayName,
      role: request.user.role,
    };
  }

  private setRefreshCookie(
    response: Response,
    refreshToken: string,
    expiresAt: Date,
  ): void {
    response.cookie(
      this.authConfiguration.refreshCookie.name,
      refreshToken,
      {
        ...this.getRefreshCookieBaseOptions(),
        expires: expiresAt,
      },
    );
  }

  private getRefreshCookieBaseOptions(): CookieOptions {
    return {
      httpOnly: this.authConfiguration.refreshCookie.httpOnly,
      secure: this.authConfiguration.refreshCookie.secure,
      sameSite: this.authConfiguration.refreshCookie.sameSite,
      path: this.authConfiguration.refreshCookie.path,
    };
  }

  private getRefreshTokenFromRequest(request: Request): string | null {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    const targetCookieName = this.authConfiguration.refreshCookie.name;
    const cookiePairs = cookieHeader.split(';');
    for (const pair of cookiePairs) {
      const [rawName, ...rawValueParts] = pair.trim().split('=');
      if (rawName !== targetCookieName) {
        continue;
      }

      const rawValue = rawValueParts.join('=').trim();
      if (rawValue === '') {
        return null;
      }

      try {
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }

    return null;
  }

  private readRequiredString(value: unknown, key: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`Invalid "${key}" value.`);
    }

    const trimmed = value.trim();
    if (trimmed === '') {
      throw new BadRequestException(`Invalid "${key}" value.`);
    }

    return trimmed;
  }
}
