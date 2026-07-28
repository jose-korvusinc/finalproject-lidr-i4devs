import { isRegistrationHost, registrationUrl } from './registration-host';

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

describe('registrationUrl', () => {
  it.each([
    ['jpasoftware.com', 'https://registro.jpasoftware.com'],
    ['www.jpasoftware.com', 'https://registro.jpasoftware.com'],
    ['barberia-paco.jpasoftware.com', 'https://registro.jpasoftware.com'],
    ['registro.jpasoftware.com', 'https://registro.jpasoftware.com'],
  ])('points %s at the registration host', (hostname, expected) => {
    expect(registrationUrl(hostname)).toBe(expected);
  });

  it('derives the apex from the current host instead of hardcoding the domain', () => {
    expect(registrationUrl('www.example.org')).toBe('https://registro.example.org');
  });

  it.each(['localhost', '127.0.0.1'])(
    'falls back to the in-app route on %s, where there are no subdomains',
    (hostname) => {
      expect(registrationUrl(hostname)).toBe('/register');
    },
  );
});
