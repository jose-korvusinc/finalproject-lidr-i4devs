import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import type { Mock } from 'vitest';
import { TenantRegistration } from './tenant-registration';
import { TenantRegistrationApi } from './tenant-registration.api';

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

function buttonByName(root: HTMLElement, pattern: RegExp): HTMLButtonElement | undefined {
  return Array.from(root.querySelectorAll('button')).find((button) => {
    const label = `${button.textContent ?? ''} ${button.getAttribute('aria-label') ?? ''}`;
    return pattern.test(label);
  });
}

function liveRegions(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>('[aria-live], [role="status"], [role="alert"]'),
  );
}

function subdomainStatus(component: TenantRegistration): string | undefined {
  const holder = component as unknown as { subdomainStatus?: () => string };
  return holder.subdomainStatus?.();
}

interface ApiDouble {
  checkSubdomain: Mock<(subdomain: string) => Observable<boolean>>;
  register: Mock<(...args: unknown[]) => Observable<unknown>>;
}

describe('TenantRegistration subdomain availability', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function setup(availability: Observable<boolean>) {
    const apiDouble: ApiDouble = {
      checkSubdomain: vi.fn<(subdomain: string) => Observable<boolean>>().mockReturnValue(availability),
      register: vi.fn<(...args: unknown[]) => Observable<unknown>>(),
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

  async function flush(fixture: Awaited<ReturnType<typeof setup>>['fixture']) {
    fixture.detectChanges();
    await fixture.whenStable();
    vi.advanceTimersByTime(1000);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('reports the subdomain as available and announces it in a live region', async () => {
    const { fixture, component, root, apiDouble } = await setup(of(true));

    component.model.set({
      name: 'Barberia Paco',
      ownerEmail: 'paco@x.test',
      subdomain: 'barberia-ana',
    });
    await flush(fixture);

    expect(apiDouble.checkSubdomain).toHaveBeenCalledWith('barberia-ana');
    expect(subdomainStatus(component)).toBe('available');

    const region = liveRegions(root).find((element) =>
      /available/i.test(element.textContent ?? ''),
    );
    expect(region).toBeTruthy();
  });

  it('reports the subdomain as taken, marks the input invalid and disables Create', async () => {
    const { fixture, component, root, apiDouble } = await setup(of(false));

    component.model.set({
      name: 'Barberia Paco',
      ownerEmail: 'paco@x.test',
      subdomain: 'barberia-paco',
    });
    await flush(fixture);

    expect(apiDouble.checkSubdomain).toHaveBeenCalledWith('barberia-paco');
    expect(subdomainStatus(component)).toBe('taken');

    const subdomainInput = inputByName(root, /subdomain|domain|slug/i);
    expect(subdomainInput).toBeTruthy();
    expect(subdomainInput!.getAttribute('aria-invalid')).toBe('true');

    const create = buttonByName(root, /create/i);
    expect(create).toBeTruthy();
    expect(create!.disabled).toBe(true);
  });

  it('does not query availability for an invalid subdomain and stays idle', async () => {
    const { fixture, component, root, apiDouble } = await setup(of(true));

    component.model.set({
      name: 'Barberia Paco',
      ownerEmail: 'paco@x.test',
      subdomain: 'Invalid.Sub',
    });
    await flush(fixture);

    expect(apiDouble.checkSubdomain).not.toHaveBeenCalled();
    expect(subdomainStatus(component)).toBe('idle');

    const create = buttonByName(root, /create/i);
    expect(create).toBeTruthy();
    expect(create!.disabled).toBe(true);
  });
});
