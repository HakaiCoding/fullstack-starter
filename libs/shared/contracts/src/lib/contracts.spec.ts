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
      role: 'user',
      email: 'example.com',
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
    expect(query.role).toBe('user');
    expect(query.email).toBe('example.com');
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

  it('should include expanded stable error status/code coverage', () => {
    const notFoundCode: ApiErrorCode = 'RESOURCE_NOT_FOUND';
    const conflictCode: ApiErrorCode = 'RESOURCE_CONFLICT';
    const serviceUnavailableCode: ApiErrorCode = 'SERVICE_UNAVAILABLE';
    const internalServerCode: ApiErrorCode = 'INTERNAL_SERVER_ERROR';
    const notFoundResponse: ApiErrorResponse = {
      statusCode: 404,
      error: {
        code: notFoundCode,
        message: 'Resource not found.',
      },
    };
    const conflictResponse: ApiErrorResponse = {
      statusCode: 409,
      error: {
        code: conflictCode,
        message: 'Request could not be completed due to a conflict.',
      },
    };
    const fallbackResponse: ApiErrorResponse = {
      statusCode: 500,
      error: {
        code: internalServerCode,
        message: 'An unexpected error occurred.',
      },
    };
    const serviceUnavailableResponse: ApiErrorResponse = {
      statusCode: 503,
      error: {
        code: serviceUnavailableCode,
        message: 'Service unavailable.',
      },
    };

    expect(notFoundResponse.statusCode).toBe(404);
    expect(conflictResponse.error.code).toBe('RESOURCE_CONFLICT');
    expect(fallbackResponse.statusCode).toBe(500);
    expect(serviceUnavailableResponse.statusCode).toBe(503);
  });
});
