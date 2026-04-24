import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { DatabaseReadinessService } from './database-readiness.service';

describe('DatabaseReadinessService', () => {
  it('should return unhealthy when datasource is not initialized', async () => {
    const dataSourceMock = {
      isInitialized: false,
      query: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DatabaseReadinessService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    const service = moduleRef.get(DatabaseReadinessService);
    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('unhealthy');
    expect(readiness.reason).toBe('Database connection is not initialized.');
    expect(dataSourceMock.query).not.toHaveBeenCalled();
  });

  it('should return healthy when SELECT 1 succeeds', async () => {
    const dataSourceMock = {
      isInitialized: true,
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DatabaseReadinessService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    const service = moduleRef.get(DatabaseReadinessService);
    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('healthy');
    expect(readiness.checkedAt).toEqual(expect.any(String));
    expect(dataSourceMock.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('should return unhealthy when query fails', async () => {
    const dataSourceMock = {
      isInitialized: true,
      query: jest.fn().mockRejectedValue(new Error('connection failed')),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DatabaseReadinessService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    const service = moduleRef.get(DatabaseReadinessService);
    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('unhealthy');
    expect(readiness.reason).toBe('Database query failed.');
    expect(dataSourceMock.query).toHaveBeenCalledWith('SELECT 1');
  });
});
