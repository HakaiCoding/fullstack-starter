import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSessionEntity } from '../../../db/entities/auth-session.entity';
import { UserEntity } from '../../../db/entities/user.entity';
import { type AuthConfig, authConfig } from '../../config/auth.config';
import { AuthController } from './auth.controller';
import { AuthCoreService } from './auth-core.service';
import { JwtAccessStrategy } from './jwt-access.strategy';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UserEntity, AuthSessionEntity]),
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.registerAsync({
      inject: [authConfig.KEY],
      useFactory: (config: AuthConfig) => ({
        secret: config.accessToken.secret,
        signOptions: {
          expiresIn: config.accessToken.ttlSeconds,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthCoreService, JwtAccessStrategy, RolesGuard],
  exports: [PassportModule, JwtModule, AuthCoreService, RolesGuard],
})
export class AuthModule {}
