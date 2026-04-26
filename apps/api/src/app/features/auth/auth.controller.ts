import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type {
  AccessTokenResponse,
  AuthMeResponse,
  LogoutResponse,
} from '@fullstack-starter/contracts';
import { type Request, type Response, type CookieOptions } from 'express';
import { type AuthConfig, authConfig } from '../../config/auth.config';
import { AuthCoreService } from './auth-core.service';
import { type AuthenticatedRequestUser } from './auth.types';
import { LoginRequestDto } from './dto/login-request.dto';
import { JwtAccessAuthGuard } from './jwt-access-auth.guard';

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
  @UsePipes(
    new ValidationPipe({
      transform: true,
    }),
  )
  async login(
    @Body() body: LoginRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponse> {
    const tokenPair = await this.authCoreService.issueTokenPairForCredentials(
      body.email,
      body.password,
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
}
