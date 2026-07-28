import type { Route, Routes } from '@angular/router';
import { routes } from '../app.routes';
import { AdminLayout } from './admin-layout';

function findByPath(list: Routes, path: string): Route {
  const match = list.find((route) => route.path === path);
  if (!match) {
    throw new Error(`No route found with path "${path}"`);
  }
  return match;
}

describe('admin area routes', () => {
  it('groups the owner sections under a lazily loaded shell', async () => {
    const admin = findByPath(routes, 'admin');

    expect(typeof admin.loadComponent).toBe('function');
    expect(await admin.loadComponent!()).toBe(AdminLayout);
  });

  it('keeps the public urls of both sections', () => {
    const children = findByPath(routes, 'admin').children ?? [];

    expect(typeof findByPath(children, 'schedule').loadChildren).toBe('function');
    expect(typeof findByPath(children, 'catalog').loadChildren).toBe('function');
  });

  it('lands on the schedule section when no section is given', () => {
    const children = findByPath(routes, 'admin').children ?? [];

    const fallback = findByPath(children, '');

    expect(fallback.redirectTo).toBe('schedule');
    expect(fallback.pathMatch).toBe('full');
  });

  it('no longer exposes the sections as flat root routes', () => {
    const paths = routes.map((route) => route.path);

    expect(paths).not.toContain('admin/schedule');
    expect(paths).not.toContain('admin/catalog');
  });
});
