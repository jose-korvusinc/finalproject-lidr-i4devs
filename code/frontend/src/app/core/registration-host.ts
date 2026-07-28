export const REGISTRATION_SUBDOMAIN = 'registro';

export const RESERVED_SUBDOMAINS = [REGISTRATION_SUBDOMAIN, 'www', 'api', 'admin', 'app'];

export function isReservedSubdomain(label: string): boolean {
  return RESERVED_SUBDOMAINS.includes(label.toLowerCase());
}

export function registrationUrl(hostname: string): string {
  const labels = hostname.split('.');
  const isIpv4 = labels.every((label) => /^\d+$/.test(label));
  if (labels.length < 2 || isIpv4) {
    return '/register';
  }
  return `https://${REGISTRATION_SUBDOMAIN}.${labels.slice(-2).join('.')}`;
}

export function isRegistrationHost(hostname: string): boolean {
  const labels = hostname.split('.');
  if (labels.length < 3) {
    return false;
  }
  return labels[0].toLowerCase() === REGISTRATION_SUBDOMAIN;
}
