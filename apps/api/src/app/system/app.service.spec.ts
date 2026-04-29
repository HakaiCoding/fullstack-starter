import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('should return stable API root payload', () => {
      expect(service.getData()).toEqual({
        name: 'Fullstack Starter API',
        version: 'v1',
        status: 'ok',
      });
    });
  });

  describe('getHealth', () => {
    it('should return stable API liveness payload', () => {
      expect(service.getHealth()).toEqual({
        status: 'ok',
        checks: {
          api: 'ok',
        },
      });
    });
  });

  describe('getDatabaseHealth', () => {
    it('should return stable DB readiness success payload', () => {
      expect(service.getDatabaseHealth()).toEqual({
        status: 'ok',
        checks: {
          database: 'ok',
        },
      });
    });
  });
});
