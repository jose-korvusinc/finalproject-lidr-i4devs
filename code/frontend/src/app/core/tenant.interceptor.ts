import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { TenantContext } from './tenant-context';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const slug = inject(TenantContext).slug();
  return slug ? next(req.clone({ setHeaders: { 'X-Tenant': slug } })) : next(req);
};
