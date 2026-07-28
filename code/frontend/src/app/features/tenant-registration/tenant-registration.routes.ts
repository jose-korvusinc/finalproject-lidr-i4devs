import { Routes } from '@angular/router';

export const tenantRegistrationRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tenant-registration').then((m) => m.TenantRegistration),
  },
];
