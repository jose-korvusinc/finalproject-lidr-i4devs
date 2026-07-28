import { resolveTenantSlug } from './tenant-context';

export function shouldRedirectTenantRoot(hostname: string, segmentCount: number): boolean {
  if (segmentCount > 0) {
    return false;
  }
  return resolveTenantSlug(hostname) !== null;
}
