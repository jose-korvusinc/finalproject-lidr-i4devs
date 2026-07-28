import { shouldRedirectTenantRoot } from './tenant-root';

describe('shouldRedirectTenantRoot', () => {
  it('redirects the root of a tenant subdomain', () => {
    expect(shouldRedirectTenantRoot('barberia-paco.jpasoftware.com', 0)).toBe(true);
  });

  it.each(['jpasoftware.com', 'www.jpasoftware.com'])(
    'leaves %s on the marketing landing',
    (hostname) => {
      expect(shouldRedirectTenantRoot(hostname, 0)).toBe(false);
    },
  );

  it.each(['registro.jpasoftware.com', 'api.jpasoftware.com', 'admin.jpasoftware.com'])(
    'leaves the reserved host %s alone',
    (hostname) => {
      expect(shouldRedirectTenantRoot(hostname, 0)).toBe(false);
    },
  );

  it.each(['localhost', '127.0.0.1'])(
    'leaves %s alone so local development keeps working',
    (hostname) => {
      expect(shouldRedirectTenantRoot(hostname, 0)).toBe(false);
    },
  );

  it('never touches a deeper url, so the public booking page keeps working', () => {
    expect(shouldRedirectTenantRoot('barberia-paco.jpasoftware.com', 1)).toBe(false);
    expect(shouldRedirectTenantRoot('barberia-paco.jpasoftware.com', 2)).toBe(false);
  });
});
