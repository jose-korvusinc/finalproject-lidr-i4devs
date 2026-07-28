import { Routes } from '@angular/router';
import { registrationHostGuard } from './core/registration-host.guard';

export const routes: Routes = [
  {
    path: '',
    canMatch: [registrationHostGuard],
    loadChildren: () =>
      import('./features/tenant-registration/tenant-registration.routes').then(
        (m) => m.tenantRegistrationRoutes,
      ),
  },
  {
    path: '',
    loadChildren: () => import('./features/home/home.routes').then((m) => m.homeRoutes),
  },
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'booking',
    loadChildren: () => import('./features/booking/booking.routes').then((m) => m.bookingRoutes),
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./features/tenant-registration/tenant-registration.routes').then(
        (m) => m.tenantRegistrationRoutes,
      ),
  },
  {
    path: 'admin/schedule',
    loadChildren: () => import('./features/schedule/schedule.routes').then((m) => m.scheduleRoutes),
  },
  {
    path: 'admin/catalog',
    loadChildren: () => import('./features/catalog/catalog.routes').then((m) => m.catalogRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
