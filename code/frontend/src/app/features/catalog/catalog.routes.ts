import { Routes } from '@angular/router';

export const catalogRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./catalog-panel').then((m) => m.CatalogPanel),
  },
];
