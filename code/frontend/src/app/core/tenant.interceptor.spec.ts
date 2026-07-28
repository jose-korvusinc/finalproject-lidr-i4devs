import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TenantContext } from './tenant-context';
import { tenantInterceptor } from './tenant.interceptor';

interface TenantContextDouble {
  slug: () => string | null;
}

function configure(slug: string | null): void {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([tenantInterceptor])),
      provideHttpClientTesting(),
      { provide: TenantContext, useValue: { slug: () => slug } satisfies TenantContextDouble },
    ],
  });
}

describe('tenantInterceptor', () => {
  let httpMock: HttpTestingController;

  afterEach(() => {
    httpMock.verify();
  });

  it('adds the X-Tenant header with the resolved slug when a tenant is present', () => {
    configure('acme');
    const http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);

    http.get('/api/x').subscribe();

    const req = httpMock.expectOne('/api/x');
    expect(req.request.headers.get('X-Tenant')).toBe('acme');
    req.flush({});
  });

  it('does not add the X-Tenant header when there is no tenant', () => {
    configure(null);
    const http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);

    http.get('/api/x').subscribe();

    const req = httpMock.expectOne('/api/x');
    expect(req.request.headers.has('X-Tenant')).toBe(false);
    req.flush({});
  });
});
