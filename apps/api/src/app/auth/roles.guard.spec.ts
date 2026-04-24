import {
  ForbiddenException,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

class UndecoratedController {
  openRoute(): void {
    return;
  }
}

@Roles('user')
class RoleProtectedController {
  classLevelProtectedRoute(): void {
    return;
  }

  @Roles('admin')
  adminOnlyRoute(): void {
    return;
  }
}

function createExecutionContext(params: {
  controller: object;
  handler: (...args: never[]) => unknown;
  user?: unknown;
}): ExecutionContext {
  const request = params.user === undefined ? {} : { user: params.user };

  return {
    getClass: () => params.controller,
    getHandler: () => params.handler,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  it('allows access when no role metadata is present', () => {
    const context = createExecutionContext({
      controller: UndecoratedController,
      handler: UndecoratedController.prototype.openRoute,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('returns 401 when route requires roles and user context is missing', () => {
    const context = createExecutionContext({
      controller: RoleProtectedController,
      handler: RoleProtectedController.prototype.classLevelProtectedRoute,
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('returns 401 when route requires roles and user role is invalid', () => {
    const context = createExecutionContext({
      controller: RoleProtectedController,
      handler: RoleProtectedController.prototype.classLevelProtectedRoute,
      user: { role: 'superadmin' },
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('returns 403 when authenticated user role is insufficient', () => {
    const context = createExecutionContext({
      controller: RoleProtectedController,
      handler: RoleProtectedController.prototype.adminOnlyRoute,
      user: { role: 'user' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows access when authenticated user role matches required roles', () => {
    const context = createExecutionContext({
      controller: RoleProtectedController,
      handler: RoleProtectedController.prototype.adminOnlyRoute,
      user: { role: 'admin' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
