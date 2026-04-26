import { TestBed } from '@angular/core/testing';
import { AuthStateService } from './auth-state.service';

describe('AuthStateService', () => {
  let service: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthStateService);
  });

  it('starts with no access token and unauthenticated state', () => {
    expect(service.accessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('stores a normalized access token and marks authenticated', () => {
    service.setAccessToken('  active-access-token  ');

    expect(service.accessToken()).toBe('active-access-token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('clears token when provided token is blank after trim', () => {
    service.setAccessToken('active-access-token');
    expect(service.accessToken()).toBe('active-access-token');

    service.setAccessToken('   ');

    expect(service.accessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('clears token explicitly', () => {
    service.setAccessToken('active-access-token');
    expect(service.isAuthenticated()).toBe(true);

    service.clear();

    expect(service.accessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('keeps token state in memory only across service instances', () => {
    service.setAccessToken('active-access-token');
    expect(service.accessToken()).toBe('active-access-token');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshService = TestBed.inject(AuthStateService);

    expect(freshService.accessToken()).toBeNull();
    expect(freshService.isAuthenticated()).toBe(false);
  });
});
