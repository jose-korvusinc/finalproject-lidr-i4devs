import { Routes } from '@angular/router';

export const scheduleRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./schedule-panel').then((m) => m.SchedulePanel),
  },
];
