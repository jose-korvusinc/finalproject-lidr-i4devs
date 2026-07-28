import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Login } from './login';

function accessibleName(el: Element, root: HTMLElement): string {
  const id = el.getAttribute('id');
  if (id) {
    const label = root.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label) {
      return label.textContent?.trim() ?? '';
    }
  }
  return el.getAttribute('aria-label')?.trim() ?? '';
}

function inputByName(root: HTMLElement, pattern: RegExp): HTMLInputElement | undefined {
  return Array.from(root.querySelectorAll('input')).find((input) =>
    pattern.test(accessibleName(input, root)),
  );
}

describe('Login', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return { fixture, component, router, root };
  }

  async function settle(fixture: Awaited<ReturnType<typeof setup>>['fixture']) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('renders email and password controls each with an accessible name', async () => {
    const { root } = await setup();

    expect(inputByName(root, /email/i)).toBeTruthy();
    expect(inputByName(root, /password/i)).toBeTruthy();
    for (const input of Array.from(root.querySelectorAll('input'))) {
      expect(accessibleName(input, root).length).toBeGreaterThan(0);
    }
  });

  it('navigates to the schedule backoffice on valid submit', async () => {
    const { fixture, component, router } = await setup();
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.model.set({ email: 'owner@shop.test', password: 'super-secret' });
    await settle(fixture);

    component.submit();

    expect(navigate).toHaveBeenCalledWith(['/admin/schedule']);
  });

  it('does not navigate and exposes an accessible error for an invalid email', async () => {
    const { fixture, component, router, root } = await setup();
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.model.set({ email: 'not-an-email', password: 'super-secret' });
    component.form.email().markAsTouched();
    await settle(fixture);

    const emailInput = inputByName(root, /email/i);
    expect(emailInput!.getAttribute('aria-invalid')).toBe('true');

    const describedBy = emailInput!.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const error = root.querySelector(`#${CSS.escape(describedBy!)}`);
    expect(error?.getAttribute('role')).toBe('alert');
    expect(error?.textContent?.trim().length).toBeGreaterThan(0);

    component.submit();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('passes a basic accessibility check', async () => {
    const { root } = await setup();

    expect(root.querySelectorAll('main').length).toBe(1);
    expect(root.querySelectorAll('h1').length).toBe(1);
    for (const link of Array.from(root.querySelectorAll('a'))) {
      const label = `${link.textContent ?? ''} ${link.getAttribute('aria-label') ?? ''}`.trim();
      expect(label.length).toBeGreaterThan(0);
      expect(link.getAttribute('href')).toBeTruthy();
    }
  });
});
