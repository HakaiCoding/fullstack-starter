import { type ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { ListUsersQueryDto } from './list-users-query.dto';

const queryValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
});

const queryMetadata: ArgumentMetadata = {
  type: 'query',
  metatype: ListUsersQueryDto,
  data: undefined,
};

async function validateQuery(value: unknown): Promise<ListUsersQueryDto> {
  return (await queryValidationPipe.transform(
    value,
    queryMetadata,
  )) as ListUsersQueryDto;
}

describe('ListUsersQueryDto', () => {
  it('applies accepted defaults when query is empty', async () => {
    await expect(validateQuery({})).resolves.toEqual({
      page: 1,
      pageSize: 25,
      sortBy: 'createdAt',
      sortDir: 'desc',
    });
  });

  it('accepts valid explicit query values', async () => {
    await expect(
      validateQuery({
        page: '2',
        pageSize: '100',
        sortBy: 'createdAt',
        sortDir: 'asc',
      }),
    ).resolves.toEqual({
      page: 2,
      pageSize: 100,
      sortBy: 'createdAt',
      sortDir: 'asc',
    });
  });

  it('rejects out-of-bounds and invalid enum values', async () => {
    await expect(validateQuery({ page: '0' })).rejects.toThrow(BadRequestException);
    await expect(validateQuery({ pageSize: '101' })).rejects.toThrow(
      BadRequestException,
    );
    await expect(validateQuery({ sortDir: 'descending' })).rejects.toThrow(
      BadRequestException,
    );
    await expect(validateQuery({ sortBy: 'email' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects unknown query fields', async () => {
    await expect(
      validateQuery({
        role: 'admin',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
