import { TestBed } from '@angular/core/testing';
import { ContactForm } from './contact-form';
import { BookingCustomer } from './booking.api';

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

function liveRegions(root: HTMLElement): Element[] {
  return Array.from(root.querySelectorAll('[aria-live], [role="alert"]')).filter(
    (element) => (element.textContent?.trim().length ?? 0) > 0,
  );
}

function describedByMessage(el: Element, root: HTMLElement): Element | undefined {
  const describedBy = el.getAttribute('aria-describedby');
  if (!describedBy) {
    return undefined;
  }
  return describedBy
    .split(/\s+/)
    .map((id) => root.querySelector(`#${CSS.escape(id)}`))
    .find((element) => (element?.textContent?.trim().length ?? 0) > 0) as Element | undefined;
}

function setInputValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
}

function contact(overrides: Partial<BookingCustomer> = {}): BookingCustomer {
  return {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+34600000000',
    ...overrides,
  };
}

describe('ContactForm', () => {
  async function setup(initialContact?: BookingCustomer | null) {
    await TestBed.configureTestingModule({
      imports: [ContactForm],
    }).compileComponents();

    const fixture = TestBed.createComponent(ContactForm);
    const component = fixture.componentInstance;
    if (initialContact !== undefined) {
      fixture.componentRef.setInput('initialContact', initialContact);
    }
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

  it('renders name, email and phone inputs each with an accessible name', async () => {
    const { root } = await setup();

    const name = inputByName(root, /name/i);
    const email = inputByName(root, /email/i);
    const phone = inputByName(root, /phone/i);

    expect(name).toBeTruthy();
    expect(email).toBeTruthy();
    expect(phone).toBeTruthy();

    for (const control of [name, email, phone]) {
      expect(accessibleName(control!, root).length).toBeGreaterThan(0);
    }
  });

  it('does not use the placeholder as the accessible label of any control', async () => {
    const { root } = await setup();

    for (const input of Array.from(root.querySelectorAll('input'))) {
      const name = accessibleName(input, root);
      const placeholder = input.getAttribute('placeholder');
      if (placeholder) {
        expect(name).not.toBe(placeholder.trim());
      }
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it('is valid for well-formed contact details and emits the model on Confirm', async () => {
    const { fixture, component, root } = await setup(
      contact({ name: 'Ada Lovelace', email: 'ada@example.com', phone: '+34600000000' }),
    );

    let emitted: BookingCustomer | undefined;
    component.confirmed.subscribe((value) => (emitted = value));

    expect(component.saveDisabled()).toBe(false);

    const confirm = buttonByName(root, /confirm/i);
    expect(confirm).toBeTruthy();
    expect(confirm!.disabled).toBe(false);

    confirm!.click();
    await settle(fixture);

    expect(emitted).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+34600000000',
    });
  });

  it('reports an accessible error and blocks Confirm for an invalid email', async () => {
    const { fixture, component, root } = await setup(contact({ email: 'nope' }));

    const email = inputByName(root, /email/i);
    expect(email).toBeTruthy();

    email!.dispatchEvent(new Event('blur'));
    await settle(fixture);

    expect(email!.getAttribute('aria-invalid')).toBe('true');
    expect(describedByMessage(email!, root)).toBeTruthy();
    expect(liveRegions(root).length).toBeGreaterThan(0);

    expect(component.saveDisabled()).toBe(true);

    let emitted: BookingCustomer | undefined;
    component.confirmed.subscribe((value) => (emitted = value));

    const confirm = buttonByName(root, /confirm/i);
    expect(confirm).toBeTruthy();
    expect(confirm!.disabled).toBe(true);

    confirm!.click();
    await settle(fixture);

    expect(emitted).toBeUndefined();
  });

  it('reports an accessible error and disables Confirm when the name is empty', async () => {
    const { fixture, component, root } = await setup(contact({ name: '' }));

    const name = inputByName(root, /name/i);
    expect(name).toBeTruthy();

    name!.dispatchEvent(new Event('blur'));
    await settle(fixture);

    expect(name!.getAttribute('aria-invalid')).toBe('true');
    expect(describedByMessage(name!, root)).toBeTruthy();
    expect(liveRegions(root).length).toBeGreaterThan(0);

    expect(component.saveDisabled()).toBe(true);

    const confirm = buttonByName(root, /confirm/i);
    expect(confirm!.disabled).toBe(true);
  });

  it('reports an accessible error and disables Confirm for an invalid phone', async () => {
    const { fixture, component, root } = await setup(contact({ phone: 'abc' }));

    const phone = inputByName(root, /phone/i);
    expect(phone).toBeTruthy();

    phone!.dispatchEvent(new Event('blur'));
    await settle(fixture);

    expect(phone!.getAttribute('aria-invalid')).toBe('true');
    expect(describedByMessage(phone!, root)).toBeTruthy();
    expect(liveRegions(root).length).toBeGreaterThan(0);

    expect(component.saveDisabled()).toBe(true);

    const confirm = buttonByName(root, /confirm/i);
    expect(confirm!.disabled).toBe(true);
  });

  it('does not emit when Confirm is invoked with invalid data', async () => {
    const { fixture, component, root } = await setup(contact({ email: 'nope' }));

    let emitted: BookingCustomer | undefined;
    component.confirmed.subscribe((value) => (emitted = value));

    const email = inputByName(root, /email/i);
    expect(email).toBeTruthy();
    setInputValue(email!, 'still-not-an-email');
    await settle(fixture);

    component.onConfirm();
    await settle(fixture);

    expect(emitted).toBeUndefined();
  });

  it('emits after correcting an invalid email to a valid value', async () => {
    const { fixture, component, root } = await setup(contact({ email: 'nope' }));

    let emitted: BookingCustomer | undefined;
    component.confirmed.subscribe((value) => (emitted = value));

    expect(component.saveDisabled()).toBe(true);

    const email = inputByName(root, /email/i);
    setInputValue(email!, 'ada@example.com');
    await settle(fixture);

    expect(component.saveDisabled()).toBe(false);

    const confirm = buttonByName(root, /confirm/i);
    expect(confirm!.disabled).toBe(false);

    confirm!.click();
    await settle(fixture);

    expect(emitted).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+34600000000',
    });
  });

  it('renders localized visible text for the Confirm action and the field labels', async () => {
    const { root } = await setup();

    const confirm = buttonByName(root, /confirm/i);
    expect(confirm).toBeTruthy();
    expect((confirm!.textContent ?? '').trim().length).toBeGreaterThan(0);

    const name = inputByName(root, /name/i);
    const email = inputByName(root, /email/i);
    const phone = inputByName(root, /phone/i);
    for (const control of [name, email, phone]) {
      expect(accessibleName(control!, root).length).toBeGreaterThan(0);
    }
  });
});
