import { resolveTenantSlug } from './tenant-context';

describe('resolveTenantSlug', () => {
  it('returns the first label as slug for a tenant subdomain', () => {
    expect(resolveTenantSlug('acme.app.com')).toBe('acme');
  });

  it('supports hyphenated tenant slugs', () => {
    expect(resolveTenantSlug('barberia-paco.jpasoftware.com')).toBe('barberia-paco');
  });

  it('returns null for the www subdomain', () => {
    expect(resolveTenantSlug('www.app.com')).toBeNull();
  });

  it('returns null for an apex host with two labels', () => {
    expect(resolveTenantSlug('app.com')).toBeNull();
  });

  it('returns null for localhost', () => {
    expect(resolveTenantSlug('localhost')).toBeNull();
  });

  it('returns null for an IP address', () => {
    expect(resolveTenantSlug('127.0.0.1')).toBeNull();
  });
});
