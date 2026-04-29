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
    it('should return stable API root payload', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getData()).toEqual({
        name: 'Fullstack Starter API',
        version: 'v1',
        status: 'ok',
      });
    });
  });

  describe('getHealth', () => {
    it('should return stable API liveness payload', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        checks: {
          api: 'ok',
        },
      });
    });
  });

  describe('getDatabaseReadiness', () => {
    it('should return stable DB readiness success payload when DB is available', async () => {
      const appController = app.get<AppController>(AppController);
      const readiness = await appController.getDatabaseReadiness();

      expect(readiness).toEqual({
        status: 'ok',
        checks: {
          database: 'ok',
        },
      });
    });

    it('should throw ServiceUnavailableException with generic message when DB is unavailable', async () => {
      const appController = app.get<AppController>(AppController);
      databaseReadinessServiceMock.getReadiness = jest.fn().mockResolvedValue({
        status: 'unhealthy',
        checkedAt: new Date().toISOString(),
        reason: 'Database query failed.',
      });

      await expect(appController.getDatabaseReadiness()).rejects.toMatchObject({
        status: 503,
        response: {
          message: 'Service unavailable.',
        },
      });
    });
  });
});
