import { Routes } from '@angular/router';

export const bookingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./booking-widget').then((m) => m.BookingWidget),
  },
];
