import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, type JwtVerifyOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthSessionEntity } from '../../db/entities/auth-session.entity';
import { UserEntity } from '../../db/entities/user.entity';
import { type AuthConfig, authConfig } from '../config/auth.config';
import { type AuthRole } from './auth.types';

const scryptAsync = promisify(scrypt);
const PASSWORD_HASH_ALGORITHM = 'scrypt';
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_BYTES = 16;
const ACCESS_TOKEN_TYPE = 'access';
const REFRESH_TOKEN_TYPE = 'refresh';

interface RefreshTokenPayload {
  sub: string;
  jti: string;
  tokenType: typeof REFRESH_TOKEN_TYPE;
}

export interface IssuedAuthTokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface AuthenticatedTokenPair extends IssuedAuthTokenPair {
  userId: string;
}

export interface RotatedAuthTokenPair extends IssuedAuthTokenPair {
  userId: string;
}

@Injectable()
export class AuthCoreService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly authConfiguration: AuthConfig,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(AuthSessionEntity)
    private readonly authSessionsRepository: Repository<AuthSessionEntity>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const normalizedPassword = password.trim();
    if (normalizedPassword === '') {
      throw new Error('Password must not be empty.');
    }

    const salt = randomBytes(PASSWORD_SALT_BYTES).toString('hex');
    const derivedKey = await scryptAsync(
      normalizedPassword,
      salt,
      PASSWORD_KEY_LENGTH,
    );

    return `${PASSWORD_HASH_ALGORITHM}$${salt}$${(derivedKey as Buffer).toString('hex')}`;
  }

  async verifyPassword(
    plainPassword: string,
    passwordHash: string | null,
  ): Promise<boolean> {
    if (!passwordHash) {
      return false;
    }

    const parsedHash = this.parsePasswordHash(passwordHash);
    if (!parsedHash) {
      return false;
    }

    const derivedKey = await scryptAsync(
      plainPassword,
      parsedHash.salt,
      PASSWORD_KEY_LENGTH,
    );

    return this.safeCompareHex(
      (derivedKey as Buffer).toString('hex'),
      parsedHash.digest,
    );
  }

  async issueTokenPairForUser(userId: string): Promise<IssuedAuthTokenPair> {
    const user = await this.getUserForTokenIssuance(userId);
    return this.issueTokenPairForPersistedUser(user);
  }

  async issueTokenPairForCredentials(
    email: string,
    password: string,
  ): Promise<AuthenticatedTokenPair> {
    const normalizedEmail = email.trim();
    const user = await this.usersRepository.findOne({
      where: {
        email: normalizedEmail,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const tokenPair = await this.issueTokenPairForPersistedUser(user);
    return {
      userId: user.id,
      ...tokenPair,
    };
  }

  async rotateRefreshToken(
    refreshToken: string,
  ): Promise<RotatedAuthTokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const hashedPresentedToken = this.hashRefreshToken(refreshToken);

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const transactionalSessionRepository = transactionalEntityManager.getRepository(
        AuthSessionEntity,
      );
      const activeSession = await transactionalSessionRepository.findOne({
        where: {
          user: {
            id: payload.sub,
          },
        },
        relations: {
          user: true,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!activeSession) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      const now = new Date();
      if (activeSession.revokedAt !== null || activeSession.expiresAt <= now) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      const isTokenMatch = this.safeCompareHex(
        hashedPresentedToken,
        activeSession.refreshTokenHash,
      );
      if (!isTokenMatch) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      const nextTokenPair = await this.createSignedTokenPair(
        activeSession.user.id,
        activeSession.user.role,
      );
      activeSession.refreshTokenHash = this.hashRefreshToken(
        nextTokenPair.refreshToken,
      );
      activeSession.expiresAt = nextTokenPair.refreshTokenExpiresAt;
      activeSession.revokedAt = null;
      await transactionalSessionRepository.save(activeSession);

      return {
        userId: payload.sub,
        ...nextTokenPair,
      };
    });
  }

  async invalidateSessionForRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      const hashedPresentedToken = this.hashRefreshToken(refreshToken);
      const activeSession = await this.authSessionsRepository.findOne({
        where: {
          user: {
            id: payload.sub,
          },
        },
        relations: {
          user: true,
        },
      });

      if (!activeSession) {
        return;
      }

      const isTokenMatch = this.safeCompareHex(
        hashedPresentedToken,
        activeSession.refreshTokenHash,
      );
      if (!isTokenMatch || activeSession.revokedAt !== null) {
        return;
      }

      activeSession.revokedAt = new Date();
      await this.authSessionsRepository.save(activeSession);
    } catch {
      return;
    }
  }

  async invalidateSessionForUser(userId: string): Promise<void> {
    const activeSession = await this.authSessionsRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
      relations: {
        user: true,
      },
    });

    if (!activeSession || activeSession.revokedAt !== null) {
      return;
    }

    activeSession.revokedAt = new Date();
    await this.authSessionsRepository.save(activeSession);
  }

  private async createSignedTokenPair(
    userId: string,
    role: AuthRole,
  ): Promise<IssuedAuthTokenPair> {
    const refreshTokenId = randomUUID();
    const refreshTokenExpiresAt = new Date(
      Date.now() + this.authConfiguration.refreshToken.ttlSeconds * 1000,
    );

    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId,
        tokenType: ACCESS_TOKEN_TYPE,
        role,
      },
      {
        secret: this.authConfiguration.accessToken.secret,
        expiresIn: this.authConfiguration.accessToken.ttlSeconds,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: userId,
        jti: refreshTokenId,
        tokenType: REFRESH_TOKEN_TYPE,
      },
      {
        secret: this.authConfiguration.refreshToken.secret,
        expiresIn: this.authConfiguration.refreshToken.ttlSeconds,
      },
    );

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  private async replaceSessionForUser(
    userId: string,
    hashedRefreshToken: string,
    refreshTokenExpiresAt: Date,
  ): Promise<void> {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const transactionalSessionRepository = transactionalEntityManager.getRepository(
        AuthSessionEntity,
      );
      const existingSession = await transactionalSessionRepository.findOne({
        where: {
          user: {
            id: userId,
          },
        },
        relations: {
          user: true,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (existingSession) {
        existingSession.refreshTokenHash = hashedRefreshToken;
        existingSession.expiresAt = refreshTokenExpiresAt;
        existingSession.revokedAt = null;
        await transactionalSessionRepository.save(existingSession);
        return;
      }

      const createdSession = transactionalSessionRepository.create({
        user: {
          id: userId,
        } as UserEntity,
        refreshTokenHash: hashedRefreshToken,
        expiresAt: refreshTokenExpiresAt,
        revokedAt: null,
      });
      await transactionalSessionRepository.save(createdSession);
    });
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    const verifyOptions: JwtVerifyOptions = {
      secret: this.authConfiguration.refreshToken.secret,
      algorithms: ['HS256'],
    };

    try {
      const payload = await this.jwtService.verifyAsync<Partial<RefreshTokenPayload>>(
        refreshToken,
        verifyOptions,
      );

      if (
        typeof payload.sub !== 'string' ||
        typeof payload.jti !== 'string' ||
        payload.tokenType !== REFRESH_TOKEN_TYPE
      ) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      return {
        sub: payload.sub,
        jti: payload.jti,
        tokenType: REFRESH_TOKEN_TYPE,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHmac(
      'sha256',
      this.authConfiguration.refreshToken.secret,
    )
      .update(refreshToken)
      .digest('hex');
  }

  private parsePasswordHash(passwordHash: string): {
    salt: string;
    digest: string;
  } | null {
    const parts = passwordHash.split('$');
    if (parts.length !== 3) {
      return null;
    }

    const [algorithm, salt, digest] = parts;
    if (algorithm !== PASSWORD_HASH_ALGORITHM || salt === '' || digest === '') {
      return null;
    }

    return { salt, digest };
  }

  private safeCompareHex(leftHex: string, rightHex: string): boolean {
    const leftBuffer = Buffer.from(leftHex, 'hex');
    const rightBuffer = Buffer.from(rightHex, 'hex');

    if (leftBuffer.length === 0 || rightBuffer.length === 0) {
      return false;
    }

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  }

  private async getUserForTokenIssuance(
    userId: string,
  ): Promise<Pick<UserEntity, 'id' | 'role'>> {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return {
      id: user.id,
      role: user.role,
    };
  }

  private async issueTokenPairForPersistedUser(
    user: Pick<UserEntity, 'id' | 'role'>,
  ): Promise<IssuedAuthTokenPair> {
    const issuedTokenPair = await this.createSignedTokenPair(user.id, user.role);
    const hashedRefreshToken = this.hashRefreshToken(issuedTokenPair.refreshToken);

    await this.replaceSessionForUser(
      user.id,
      hashedRefreshToken,
      issuedTokenPair.refreshTokenExpiresAt,
    );

    return issuedTokenPair;
  }
}
