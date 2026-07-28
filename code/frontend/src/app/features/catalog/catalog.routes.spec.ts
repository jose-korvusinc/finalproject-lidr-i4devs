import type { Route, Routes } from '@angular/router';
import { routes } from '../../app.routes';
import { CatalogPanel } from './catalog-panel';

function findByPath(list: Routes, path: string): Route {
  const match = list.find((route) => route.path === path);
  if (!match) {
    throw new Error(`No route found with path "${path}"`);
  }
  return match;
}

async function loadFeatureRoutes(): Promise<Routes> {
  const catalogRoute = findByPath(routes, 'admin/catalog');
  expect(typeof catalogRoute.loadChildren).toBe('function');
  const loaded = await catalogRoute.loadChildren!();
  return loaded as Routes;
}

describe('catalogRoutes', () => {
  it('exposes a lazy component route for the empty path', async () => {
    const featureRoutes = await loadFeatureRoutes();

    const emptyRoute = findByPath(featureRoutes, '');
    expect(typeof emptyRoute.loadComponent).toBe('function');

    const loaded = await emptyRoute.loadComponent!();

    expect(loaded).toBeTruthy();
    expect(loaded).toBe(CatalogPanel);
  });
});

describe('root routes', () => {
  it('wires the catalog feature lazily under "admin/catalog"', async () => {
    const featureRoutes = await loadFeatureRoutes();

    expect(Array.isArray(featureRoutes)).toBe(true);

    const first = featureRoutes[0];
    expect(first.path).toBe('');
    expect(typeof first.loadComponent).toBe('function');
  });

  it('keeps the existing tenant registration route under "register"', () => {
    const registerRoute = findByPath(routes, 'register');

    expect(typeof registerRoute.loadChildren).toBe('function');
  });

  it('keeps the existing schedule route under "admin/schedule"', () => {
    const scheduleRoute = findByPath(routes, 'admin/schedule');

    expect(typeof scheduleRoute.loadChildren).toBe('function');
  });
});
