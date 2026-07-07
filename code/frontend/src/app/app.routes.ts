import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'register',
    loadChildren: () =>
      import('./features/tenant-registration/tenant-registration.routes').then(
        (m) => m.tenantRegistrationRoutes,
      ),
  },
];
