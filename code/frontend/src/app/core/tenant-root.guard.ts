import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { shouldRedirectTenantRoot } from './tenant-root';

export const tenantRootGuard: CanMatchFn = (_route, segments) => {
  if (typeof window === 'undefined') {
    return false;
  }
  if (!shouldRedirectTenantRoot(window.location.hostname, segments.length)) {
    return false;
  }
  return inject(Router).parseUrl('/login');
};
