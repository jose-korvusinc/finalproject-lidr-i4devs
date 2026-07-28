import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { TenantRegistration } from './tenant-registration';
import { TenantRegistrationApi, TenantSummary } from './tenant-registration.api';

function accessibleName(el: Element, root: HTMLElement): string {
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel.trim();
  }
  const labelledby = el.getAttribute('aria-labelledby');
  if (labelledby) {
    return labelledby
      .split(/\s+/)
      .map((id) => root.querySelector(`#${CSS.escape(id)}`)?.textContent ?? '')
      .join(' ')
      .trim();
  }
  const id = el.getAttribute('id');
  if (id) {
    const label = root.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label) {
      return label.textContent?.trim() ?? '';
    }
  }
  const wrapping = el.closest('label');
  if (wrapping) {
    return wrapping.textContent?.trim() ?? '';
  }
  return '';
}

function inputByName(root: HTMLElement, pattern: RegExp): HTMLInputElement | undefined {
  return Array.from(root.querySelectorAll('input')).find((input) =>
    pattern.test(accessibleName(input, root)),
  );
}

function alertRegions(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[role="alert"], [aria-live]'));
}

function registrationState(component: TenantRegistration): string | undefined {
  const holder = component as unknown as { registrationState?: () => string };
  return holder.registrationState?.();
}

function createdTenant(component: TenantRegistration): TenantSummary | null | undefined {
  const holder = component as unknown as {
    createdTenant?: () => TenantSummary | null;
  };
  return holder.createdTenant?.();
}

interface ApiDouble {
  checkSubdomain: Mock<(subdomain: string) => Observable<boolean>>;
  register: Mock<(...args: unknown[]) => Observable<TenantSummary>>;
}

describe('TenantRegistration outcome', () => {
  async function setup(register: ApiDouble['register']) {
    const apiDouble: ApiDouble = {
      checkSubdomain: vi.fn<(subdomain: string) => Observable<boolean>>(() => of(true)),
      register,
    };

    await TestBed.configureTestingModule({
      imports: [TenantRegistration],
      providers: [{ provide: TenantRegistrationApi, useValue: apiDouble }],
    }).compileComponents();

    const fixture = TestBed.createComponent(TenantRegistration);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return { fixture, component, root, apiDouble };
  }

  async function settle(fixture: Awaited<ReturnType<typeof setup>>['fixture']) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const validModel = {
    name: 'Barberia Paco',
    ownerEmail: 'paco@x.test',
    subdomain: 'barberia-paco',
  };

  it('confirms the registration and shows the portal URL on success', async () => {
    const summary: TenantSummary = {
      id: 'abc',
      name: 'Barberia Paco',
      subdomain: 'barberia-paco',
      status: 'active',
      portalUrl: 'https://barberia-paco.jpasoftware.com',
    };
    const register = vi.fn<(...args: unknown[]) => Observable<TenantSummary>>(() => of(summary));
    const { fixture, component, root, apiDouble } = await setup(register);

    component.model.set({ ...validModel });
    await settle(fixture);

    component.create();
    await settle(fixture);

    expect(registrationState(component)).toBe('created');
    expect(createdTenant(component)).toEqual(summary);

    expect(apiDouble.register).toHaveBeenCalledTimes(1);
    expect(apiDouble.register).toHaveBeenCalledWith({
      name: 'Barberia Paco',
      ownerEmail: 'paco@x.test',
      subdomain: 'barberia-paco',
    });

    expect(root.textContent).toContain('https://barberia-paco.jpasoftware.com');
    const link = Array.from(root.querySelectorAll('a')).find(
      (anchor) => anchor.getAttribute('href') === 'https://barberia-paco.jpasoftware.com',
    );
    expect(link).toBeTruthy();
  });

  it('shows an accessible conflict message and keeps the data on a 409', async () => {
    const register = vi.fn<(...args: unknown[]) => Observable<TenantSummary>>(() =>
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );
    const { fixture, component, root } = await setup(register);

    component.model.set({ ...validModel });
    await settle(fixture);

    component.create();
    await settle(fixture);

    expect(registrationState(component)).toBe('conflict');

    const alert = alertRegions(root).find(
      (element) => (element.textContent?.trim().length ?? 0) > 0,
    );
    expect(alert).toBeTruthy();

    expect(component.model().name).toBe('Barberia Paco');
    expect(component.model().ownerEmail).toBe('paco@x.test');

    const inputs = Array.from(root.querySelectorAll('input'));
    expect(inputs.length).toBe(3);
    expect(inputByName(root, /subdomain|domain|slug/i)).toBeTruthy();
  });

  it('does not surface the raw backend error body in the conflict message', async () => {
    const register = vi.fn<(...args: unknown[]) => Observable<TenantSummary>>(() =>
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );
    const { fixture, component, root } = await setup(register);

    component.model.set({ ...validModel });
    await settle(fixture);

    component.create();
    await settle(fixture);

    const alert = alertRegions(root).find((element) =>
      /taken|conflict|already|ocupad/i.test(element.textContent ?? ''),
    );
    expect(alert).toBeTruthy();

    const message = alert!.textContent ?? '';
    expect(message).not.toMatch(/HttpErrorResponse/);
    expect(message.trim()).not.toBe('409');
  });
});
