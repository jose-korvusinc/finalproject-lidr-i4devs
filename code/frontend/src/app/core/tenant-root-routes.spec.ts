import { routes } from '../app.routes';

describe('tenant root route', () => {
  it('runs a guard on the exact root path before falling back to the landing', () => {
    const rootRoutes = routes.filter((route) => route.path === '');

    const guarded = rootRoutes.find(
      (route) => route.canMatch?.length && route.pathMatch === 'full',
    );

    expect(guarded).toBeTruthy();

    const landingIndex = rootRoutes.findIndex((route) => route.loadChildren && !route.canMatch);
    expect(rootRoutes.indexOf(guarded!)).toBeLessThan(landingIndex);
  });

  it('keeps the landing reachable as the last root fallback', () => {
    const landing = routes.filter((route) => route.path === '').at(-1);

    expect(landing?.canMatch).toBeUndefined();
    expect(typeof landing?.loadChildren).toBe('function');
  });
});
