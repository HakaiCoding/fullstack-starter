import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SystemApiService } from './system-api.service';

describe('SystemApiService', () => {
  let service: SystemApiService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SystemApiService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('requests the API root contract', () => {
    service.getApiRoot().subscribe();

    const request = httpController.expectOne('/api/v1');
    expect(request.request.method).toBe('GET');
    request.flush({
      name: 'Fullstack Starter API',
      version: 'v1',
      status: 'ok',
    });
  });

  it('requests the API liveness contract', () => {
    service.getApiHealth().subscribe();

    const request = httpController.expectOne('/api/v1/health');
    expect(request.request.method).toBe('GET');
    request.flush({
      status: 'ok',
      checks: {
        api: 'ok',
      },
    });
  });

  it('requests the DB readiness contract', () => {
    service.getDatabaseReadiness().subscribe();

    const request = httpController.expectOne('/api/v1/health/db');
    expect(request.request.method).toBe('GET');
    request.flush({
      status: 'ok',
      checks: {
        database: 'ok',
      },
    });
  });
});
