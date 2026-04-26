import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type AuthRole, type AuthenticatedRequestUser } from './auth.types';
import { AUTH_ROLES_KEY } from './roles.decorator';

interface RequestWithUser {
  user?: Partial<AuthenticatedRequestUser>;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AuthRole[]>(
      AUTH_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const requestUser = request?.user;

    if (
      !requestUser ||
      (requestUser.role !== 'admin' && requestUser.role !== 'user')
    ) {
      throw new UnauthorizedException('Invalid access token.');
    }

    if (!requiredRoles.includes(requestUser.role)) {
      throw new ForbiddenException('Insufficient role.');
    }

    return true;
  }
}
