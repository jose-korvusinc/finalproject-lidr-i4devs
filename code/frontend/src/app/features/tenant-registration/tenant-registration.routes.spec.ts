import type { Route, Routes } from '@angular/router';
import { routes } from '../../app.routes';
import { TenantRegistration } from './tenant-registration';

function findByPath(list: Routes, path: string): Route {
  const match = list.find((route) => route.path === path);
  if (!match) {
    throw new Error(`No route found with path "${path}"`);
  }
  return match;
}

async function loadFeatureRoutes(): Promise<Routes> {
  const registerRoute = findByPath(routes, 'register');
  expect(typeof registerRoute.loadChildren).toBe('function');
  const loaded = await registerRoute.loadChildren!();
  return loaded as Routes;
}

describe('tenantRegistrationRoutes', () => {
  it('exposes a lazy component route for the empty path', async () => {
    const featureRoutes = await loadFeatureRoutes();

    const emptyRoute = findByPath(featureRoutes, '');
    expect(typeof emptyRoute.loadComponent).toBe('function');

    const loaded = await emptyRoute.loadComponent!();

    expect(loaded).toBeTruthy();
    expect(loaded).toBe(TenantRegistration);
  });
});

describe('root routes', () => {
  it('wires the tenant registration feature lazily under "register"', async () => {
    const featureRoutes = await loadFeatureRoutes();

    expect(Array.isArray(featureRoutes)).toBe(true);

    const first = featureRoutes[0];
    expect(first.path).toBe('');
    expect(typeof first.loadComponent).toBe('function');
  });
});
