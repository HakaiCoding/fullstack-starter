import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Repository } from 'typeorm';
import { UserEntity } from '../../db/entities/user.entity';
import { type AuthConfig, authConfig } from '../config/auth.config';
import { type AccessTokenPayload, type AuthenticatedRequestUser } from './auth.types';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(authConfig.KEY)
    private readonly authConfiguration: AuthConfig,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfiguration.accessToken.secret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedRequestUser> {
    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException('Invalid access token.');
    }

    const user = await this.usersRepository.findOne({
      where: {
        id: payload.sub,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid access token.');
    }

    return {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: payload.role === 'admin' ? 'admin' : 'user',
    };
  }
}
