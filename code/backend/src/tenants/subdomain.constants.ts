export const SUBDOMAIN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SUBDOMAIN_PATTERN_SOURCE = SUBDOMAIN_PATTERN.source;

export const RESERVED_SUBDOMAINS = [
  'registro',
  'www',
  'api',
  'admin',
  'app',
] as const;

export function isReservedSubdomain(subdomain: string): boolean {
  return (RESERVED_SUBDOMAINS as readonly string[]).includes(
    subdomain.toLowerCase(),
  );
}
