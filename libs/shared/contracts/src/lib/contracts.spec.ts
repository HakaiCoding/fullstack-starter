import type {
  AccessTokenResponse,
  ApiErrorCode,
  ApiErrorResponse,
  AuthMeResponse,
  AuthRole,
  LogoutResponse,
  UsersListQuery,
  UsersListResponse,
  UsersListSortBy,
  UsersListSortDir,
} from './contracts';

describe('contracts', () => {
  it('should type auth response contracts', () => {
    const role: AuthRole = 'admin';
    const accessTokenResponse: AccessTokenResponse = {
      accessToken: 'token',
    };
    const logoutResponse: LogoutResponse = {
      success: true,
    };
    const authMeResponse: AuthMeResponse = {
      id: 'user-id',
      email: 'admin@example.com',
      displayName: 'Admin',
      role,
    };

    expect(accessTokenResponse.accessToken).toBe('token');
    expect(logoutResponse.success).toBe(true);
    expect(authMeResponse.role).toBe('admin');
  });

  it('should type users list response contracts', () => {
    const sortBy: UsersListSortBy = 'createdAt';
    const sortDir: UsersListSortDir = 'desc';
    const query: UsersListQuery = {
      page: 1,
      pageSize: 25,
      sortBy,
      sortDir,
    };
    const usersListResponse: UsersListResponse = {
      users: [
        {
          id: 'user-id',
          email: 'user@example.com',
          displayName: null,
          role: 'user',
        },
      ],
      pagination: {
        page: 1,
        pageSize: 25,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        sortBy,
        sortDir,
      },
    };

    expect(query.sortBy).toBe('createdAt');
    expect(usersListResponse.users).toHaveLength(1);
    expect(usersListResponse.users[0].role).toBe('user');
    expect(usersListResponse.pagination.totalPages).toBe(1);
  });

  it('should type api error response contracts', () => {
    const code: ApiErrorCode = 'AUTH_UNAUTHENTICATED';
    const errorResponse: ApiErrorResponse = {
      statusCode: 401,
      error: {
        code,
        message: 'Authentication is required.',
      },
    };

    expect(errorResponse.statusCode).toBe(401);
    expect(errorResponse.error.code).toBe('AUTH_UNAUTHENTICATED');
  });
});
