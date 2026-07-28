export const REGISTRATION_SUBDOMAIN = 'registro';

export const RESERVED_SUBDOMAINS = [REGISTRATION_SUBDOMAIN, 'www', 'api', 'admin', 'app'];

export function isReservedSubdomain(label: string): boolean {
  return RESERVED_SUBDOMAINS.includes(label.toLowerCase());
}

export function isRegistrationHost(hostname: string): boolean {
  const labels = hostname.split('.');
  if (labels.length < 3) {
    return false;
  }
  return labels[0].toLowerCase() === REGISTRATION_SUBDOMAIN;
}
