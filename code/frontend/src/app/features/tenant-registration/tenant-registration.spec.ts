import { TestBed } from '@angular/core/testing';
import { TenantRegistration } from './tenant-registration';

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

describe('TenantRegistration', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [TenantRegistration],
    }).compileComponents();

    const fixture = TestBed.createComponent(TenantRegistration);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return { fixture, component, root };
  }

  async function settle(fixture: Awaited<ReturnType<typeof setup>>['fixture']) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('renders name, ownerEmail and subdomain controls each with an accessible name', async () => {
    const { root } = await setup();

    const inputs = Array.from(root.querySelectorAll('input'));
    expect(inputs.length).toBe(3);
    for (const input of inputs) {
      expect(accessibleName(input, root).length).toBeGreaterThan(0);
    }

    expect(inputByName(root, /name/i)).toBeTruthy();
    expect(inputByName(root, /email/i)).toBeTruthy();
    expect(inputByName(root, /subdomain|domain|slug/i)).toBeTruthy();
  });

  it('keeps the Create button disabled until the model is valid', async () => {
    const { fixture, component, root } = await setup();

    const create = buttonByName(root, /create/i);
    expect(create).toBeTruthy();
    expect(create!.disabled).toBe(true);

    component.model.set({
      name: 'Barberia Paco',
      ownerEmail: 'paco@x.test',
      subdomain: 'barberia-paco',
    });
    await settle(fixture);

    expect(create!.disabled).toBe(false);
  });

  it('exposes an accessible email error when the email format is invalid', async () => {
    const { fixture, component, root } = await setup();

    component.model.set({
      name: 'Barberia Paco',
      ownerEmail: 'not-an-email',
      subdomain: 'barberia-paco',
    });
    component.form.ownerEmail().markAsTouched();
    await settle(fixture);

    const emailInput = inputByName(root, /email/i);
    expect(emailInput).toBeTruthy();
    expect(emailInput!.getAttribute('aria-invalid')).toBe('true');

    const describedBy = emailInput!.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const errorElement = describedBy!
      .split(/\s+/)
      .map((id) => root.querySelector(`#${CSS.escape(id)}`))
      .find((element) => (element?.textContent?.trim().length ?? 0) > 0);
    expect(errorElement).toBeTruthy();
  });

  it('marks the subdomain as invalid and keeps Create disabled for a non-slug value', async () => {
    const { fixture, component, root } = await setup();

    component.model.set({
      name: 'Barberia Paco',
      ownerEmail: 'paco@x.test',
      subdomain: 'Invalid.Sub',
    });
    component.form.subdomain().markAsTouched();
    await settle(fixture);

    const subdomainInput = inputByName(root, /subdomain|domain|slug/i);
    expect(subdomainInput).toBeTruthy();
    expect(subdomainInput!.getAttribute('aria-invalid')).toBe('true');
    expect(component.form.subdomain().invalid()).toBe(true);

    const create = buttonByName(root, /create/i);
    expect(create!.disabled).toBe(true);
  });

  it('shows the subdomain suffix next to the field', async () => {
    const { root } = await setup();

    expect(root.textContent).toContain('.jpasoftware.com');
  });
});
