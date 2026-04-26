import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseReadinessService } from './database-readiness.service';

describe('AppController', () => {
  let app: TestingModule;
  const databaseReadinessServiceMock: Pick<
    DatabaseReadinessService,
    'getReadiness'
  > = {
    getReadiness: jest.fn().mockResolvedValue({
      status: 'healthy',
      checkedAt: new Date().toISOString(),
    }),
  };

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DatabaseReadinessService,
          useValue: databaseReadinessServiceMock,
        },
      ],
    }).compile();
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getData()).toEqual({ message: 'Hello API' });
    });
  });

  describe('getDatabaseReadiness', () => {
    it('should return healthy status when DB is available', async () => {
      const appController = app.get<AppController>(AppController);
      const readiness = await appController.getDatabaseReadiness();

      expect(readiness.status).toBe('healthy');
      expect(readiness.checkedAt).toEqual(expect.any(String));
    });

    it('should throw ServiceUnavailableException when DB is unavailable', async () => {
      const appController = app.get<AppController>(AppController);
      databaseReadinessServiceMock.getReadiness = jest.fn().mockResolvedValue({
        status: 'unhealthy',
        checkedAt: new Date().toISOString(),
        reason: 'Database query failed.',
      });

      await expect(appController.getDatabaseReadiness()).rejects.toMatchObject({
        status: 503,
      });
    });
  });
});
