import { Injectable, signal } from '@angular/core';
import { isReservedSubdomain } from './registration-host';

export function resolveTenantSlug(hostname: string): string | null {
  const labels = hostname.split('.');
  if (labels.length < 3) {
    return null;
  }
  const isIpv4 = labels.every((label) => /^\d+$/.test(label));
  if (isIpv4) {
    return null;
  }
  const [first] = labels;
  return isReservedSubdomain(first) ? null : first;
}

@Injectable({ providedIn: 'root' })
export class TenantContext {
  readonly slug = signal<string | null>(
    typeof window !== 'undefined' ? resolveTenantSlug(window.location.hostname) : null,
  );
}
