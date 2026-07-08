import { TestBed } from '@angular/core/testing';
import { ServiceForm } from './service-form';
import { CreateServicePayload, Service } from './catalog.api';

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
  return buttonsByName(root, pattern)[0];
}

function buttonsByName(root: HTMLElement, pattern: RegExp): HTMLButtonElement[] {
  return Array.from(root.querySelectorAll('button')).filter((button) => {
    const label = `${button.textContent ?? ''} ${button.getAttribute('aria-label') ?? ''}`;
    return pattern.test(label);
  });
}

function invalidControls(root: HTMLElement): Element[] {
  return Array.from(root.querySelectorAll('[aria-invalid="true"]'));
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

function service(overrides: Partial<Service> = {}): Service {
  return {
    id: 's1',
    name: 'Corte de pelo',
    price: '25.00',
    durationMinutes: 30,
    active: true,
    ...overrides,
  };
}

describe('ServiceForm', () => {
  async function setup(inputs?: { initialService?: Service | null; services?: Service[] }) {
    await TestBed.configureTestingModule({
      imports: [ServiceForm],
    }).compileComponents();

    const fixture = TestBed.createComponent(ServiceForm);
    const component = fixture.componentInstance;
    if (inputs?.initialService !== undefined) {
      fixture.componentRef.setInput('initialService', inputs.initialService);
    }
    if (inputs?.services !== undefined) {
      fixture.componentRef.setInput('services', inputs.services);
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

  it('renders name, price and durationMinutes inputs each with an accessible name', async () => {
    const { root } = await setup();

    const name = inputByName(root, /name/i);
    const price = inputByName(root, /price/i);
    const duration = inputByName(root, /duration|minutes/i);

    expect(name).toBeTruthy();
    expect(price).toBeTruthy();
    expect(duration).toBeTruthy();

    for (const control of [name, price, duration]) {
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

  it('is valid for a well-formed service and emits the payload on Save', async () => {
    const { fixture, component, root } = await setup({
      initialService: service({ name: 'Corte de pelo', price: '25.00', durationMinutes: 30 }),
    });

    let emitted: CreateServicePayload | undefined;
    component.save.subscribe((value) => (emitted = value));

    expect(component.saveDisabled()).toBe(false);

    const save = buttonByName(root, /save/i);
    expect(save).toBeTruthy();
    expect(save!.disabled).toBe(false);

    save!.click();
    await settle(fixture);

    expect(emitted).toEqual({ name: 'Corte de pelo', price: '25.00', durationMinutes: 30 });
  });

  it('reports an accessible error and disables Save for an invalid price', async () => {
    const { fixture, component, root } = await setup({
      initialService: service({ price: 'free' }),
    });

    const price = inputByName(root, /price/i);
    expect(price).toBeTruthy();

    price!.dispatchEvent(new Event('blur'));
    await settle(fixture);

    expect(price!.getAttribute('aria-invalid')).toBe('true');
    expect(describedByMessage(price!, root)).toBeTruthy();
    expect(liveRegions(root).length).toBeGreaterThan(0);

    expect(component.saveDisabled()).toBe(true);

    const save = buttonByName(root, /save/i);
    expect(save).toBeTruthy();
    expect(save!.disabled).toBe(true);
  });

  it('reports an accessible error and disables Save for a non-positive-integer duration', async () => {
    const { fixture, component, root } = await setup({
      initialService: service({ durationMinutes: 0 }),
    });

    const duration = inputByName(root, /duration|minutes/i);
    expect(duration).toBeTruthy();

    duration!.dispatchEvent(new Event('blur'));
    await settle(fixture);

    expect(duration!.getAttribute('aria-invalid')).toBe('true');
    expect(describedByMessage(duration!, root)).toBeTruthy();
    expect(invalidControls(root).length).toBeGreaterThan(0);

    expect(component.saveDisabled()).toBe(true);

    const save = buttonByName(root, /save/i);
    expect(save!.disabled).toBe(true);
  });

  it('reports an accessible error and disables Save when the name is empty', async () => {
    const { fixture, component, root } = await setup({
      initialService: service({ name: '' }),
    });

    const name = inputByName(root, /name/i);
    expect(name).toBeTruthy();

    name!.dispatchEvent(new Event('blur'));
    await settle(fixture);

    expect(name!.getAttribute('aria-invalid')).toBe('true');
    expect(describedByMessage(name!, root)).toBeTruthy();

    expect(component.saveDisabled()).toBe(true);

    const save = buttonByName(root, /save/i);
    expect(save!.disabled).toBe(true);
  });

  it('lists every service with a visible name and an accessible Edit action per row', async () => {
    const haircut = service({ id: 's1', name: 'Corte de pelo' });
    const coloring = service({ id: 's2', name: 'Coloracion', price: '40.00', durationMinutes: 60 });
    const { fixture, component, root } = await setup({ services: [haircut, coloring] });

    expect(root.textContent).toContain('Corte de pelo');
    expect(root.textContent).toContain('Coloracion');

    const editButtons = buttonsByName(root, /edit/i);
    expect(editButtons).toHaveLength(2);
    for (const button of editButtons) {
      const label = `${button.textContent ?? ''} ${button.getAttribute('aria-label') ?? ''}`;
      expect(label.trim().length).toBeGreaterThan(0);
    }

    let edited: Service | undefined;
    component.edit.subscribe((value) => (edited = value));

    editButtons[0].click();
    await settle(fixture);

    expect(edited).toEqual(haircut);
  });

  it('renders an accessible empty state when the catalog has no services', async () => {
    const { root } = await setup({ services: [] });

    expect(buttonsByName(root, /edit/i)).toHaveLength(0);

    const emptyState = root.querySelector('[role="status"], [aria-live], .service-form__empty');
    expect(emptyState).toBeTruthy();
    expect((emptyState?.textContent ?? '').trim().length).toBeGreaterThan(0);
  });

  it('renders localized visible text for the Save action', async () => {
    const { root } = await setup();

    const save = buttonByName(root, /save/i);
    expect(save).toBeTruthy();
    expect((save!.textContent ?? '').trim().length).toBeGreaterThan(0);
  });
});
