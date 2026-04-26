import { AUTH_ROLES_KEY, Roles } from './roles.decorator';

class DecoratedRolesController {
  @Roles('admin', 'user')
  staticRolesRoute(): void {
    return;
  }
}

describe('Roles decorator', () => {
  it('stores required roles metadata on the handler', () => {
    const metadata = Reflect.getMetadata(
      AUTH_ROLES_KEY,
      DecoratedRolesController.prototype.staticRolesRoute,
    ) as unknown;

    expect(metadata).toEqual(['admin', 'user']);
  });
});
