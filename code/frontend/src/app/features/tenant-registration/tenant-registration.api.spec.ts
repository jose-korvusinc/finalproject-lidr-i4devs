import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { TenantRegistrationApi } from './tenant-registration.api';

const SUBDOMAIN_URL = '/api/v1/tenants/subdomain-availability';
const REGISTER_URL = '/api/v1/tenants';

describe('TenantRegistrationApi', () => {
  let api: TenantRegistrationApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TenantRegistrationApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('checkSubdomain resolves to true when the subdomain is available', () => {
    let emitted: boolean | undefined;
    api.checkSubdomain('barberia-ana').subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) =>
        request.method === 'GET' &&
        request.url === SUBDOMAIN_URL &&
        request.params.get('subdomain') === 'barberia-ana',
    );
    req.flush({ available: true });

    expect(emitted).toBe(true);
  });

  it('checkSubdomain resolves to false when the subdomain is taken', () => {
    let emitted: boolean | undefined;
    api.checkSubdomain('barberia-ana').subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) =>
        request.method === 'GET' &&
        request.url === SUBDOMAIN_URL &&
        request.params.get('subdomain') === 'barberia-ana',
    );
    req.flush({ available: false });

    expect(emitted).toBe(false);
  });

  it('register posts the payload and emits the created tenant summary', () => {
    const payload = {
      name: 'Barberia Paco',
      ownerEmail: 'paco@x.test',
      subdomain: 'barberia-paco',
    };
    const created = {
      id: 'abc',
      name: 'Barberia Paco',
      subdomain: 'barberia-paco',
      status: 'active',
      portalUrl: 'https://barberia-paco.yourplatform.com',
    };

    let emitted: unknown;
    api.register(payload).subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) => request.method === 'POST' && request.url === REGISTER_URL,
    );
    expect(req.request.body).toEqual(payload);
    req.flush(created);

    expect(emitted).toEqual(created);
  });
});
