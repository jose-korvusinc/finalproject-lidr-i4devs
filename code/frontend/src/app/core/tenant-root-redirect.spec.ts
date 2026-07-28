import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from '../app.routes';

const realLocation = window.location;

function stubHostname(hostname: string): void {
  Object.defineProperty(window, 'location', {
    value: { ...realLocation, hostname, origin: realLocation.origin },
    configurable: true,
  });
}

async function navigate(url: string): Promise<Router> {
  TestBed.configureTestingModule({
    providers: [provideRouter(routes), provideLocationMocks()],
  });
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  return router;
}

describe('tenant root redirect (router integration)', () => {
  afterEach(() => {
    Object.defineProperty(window, 'location', { value: realLocation, configurable: true });
  });

  it('sends the root of a tenant host to the login page', async () => {
    stubHostname('barberia-paco.jpasoftware.com');

    const router = await navigate('/');

    expect(router.url).toBe('/login');
  });

  it('does not hijack the public booking page of that tenant', async () => {
    stubHostname('barberia-paco.jpasoftware.com');

    const router = await navigate('/booking');

    expect(router.url).toBe('/booking');
  });

  it('leaves the marketing landing at the root of the apex domain', async () => {
    stubHostname('www.jpasoftware.com');

    const router = await navigate('/');

    expect(router.url).toBe('/');
  });
});
