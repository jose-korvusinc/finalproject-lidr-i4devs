import { isRegistrationHost } from './registration-host';

describe('isRegistrationHost', () => {
  it('accepts the registration subdomain', () => {
    expect(isRegistrationHost('registro.jpasoftware.com')).toBe(true);
  });

  it('is case insensitive', () => {
    expect(isRegistrationHost('REGISTRO.jpasoftware.com')).toBe(true);
  });

  it.each(['jpasoftware.com', 'www.jpasoftware.com', 'barberia-paco.jpasoftware.com'])(
    'rejects %s',
    (hostname) => {
      expect(isRegistrationHost(hostname)).toBe(false);
    },
  );

  it('rejects a tenant slug that merely starts with the reserved word', () => {
    expect(isRegistrationHost('registro-paco.jpasoftware.com')).toBe(false);
  });

  it('rejects localhost so local development keeps the landing at the root path', () => {
    expect(isRegistrationHost('localhost')).toBe(false);
  });
});
