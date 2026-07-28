import { TestBed } from '@angular/core/testing';
import { EmployeeForm } from './employee-form';
import { CreateEmployeePayload, Employee, Service } from './catalog.api';

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

function textInputByName(root: HTMLElement, pattern: RegExp): HTMLInputElement | undefined {
  return Array.from(root.querySelectorAll('input'))
    .filter((input) => input.type !== 'checkbox')
    .find((input) => pattern.test(accessibleName(input, root)));
}

function checkboxes(root: HTMLElement): HTMLInputElement[] {
  return Array.from(root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
}

function checkboxByName(root: HTMLElement, pattern: RegExp): HTMLInputElement | undefined {
  return checkboxes(root).find((checkbox) => pattern.test(accessibleName(checkbox, root)));
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
    name: 'Haircut',
    price: '25.00',
    durationMinutes: 30,
    active: true,
    ...overrides,
  };
}

function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'e1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    serviceIds: [],
    ...overrides,
  };
}

describe('EmployeeForm', () => {
  async function setup(inputs?: {
    initialEmployee?: Employee | null;
    employees?: Employee[];
    availableServices?: Service[];
  }) {
    await TestBed.configureTestingModule({
      imports: [EmployeeForm],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmployeeForm);
    const component = fixture.componentInstance;
    if (inputs?.initialEmployee !== undefined) {
      fixture.componentRef.setInput('initialEmployee', inputs.initialEmployee);
    }
    if (inputs?.employees !== undefined) {
      fixture.componentRef.setInput('employees', inputs.employees);
    }
    if (inputs?.availableServices !== undefined) {
      fixture.componentRef.setInput('availableServices', inputs.availableServices);
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

  it('renders name and email inputs each with an accessible name', async () => {
    const { root } = await setup();

    const name = textInputByName(root, /name/i);
    const email = textInputByName(root, /email/i);

    expect(name).toBeTruthy();
    expect(email).toBeTruthy();

    for (const control of [name, email]) {
      expect(accessibleName(control!, root).length).toBeGreaterThan(0);
    }
  });

  it('renders one checkbox per available service, each labeled with the service name', async () => {
    const haircut = service({ id: 's1', name: 'Haircut' });
    const coloring = service({ id: 's2', name: 'Coloring' });
    const { root } = await setup({ availableServices: [haircut, coloring] });

    expect(checkboxes(root)).toHaveLength(2);

    const haircutCheckbox = checkboxByName(root, /haircut/i);
    const coloringCheckbox = checkboxByName(root, /coloring/i);

    expect(haircutCheckbox).toBeTruthy();
    expect(coloringCheckbox).toBeTruthy();
  });

  it('is valid with selected services and emits the payload including serviceIds on Save', async () => {
    const haircut = service({ id: 's1', name: 'Haircut' });
    const coloring = service({ id: 's2', name: 'Coloring' });
    const { fixture, component, root } = await setup({
      initialEmployee: employee({ name: 'Ada Lovelace', email: 'ada@example.com', serviceIds: [] }),
      availableServices: [haircut, coloring],
    });

    let emitted: CreateEmployeePayload | undefined;
    component.save.subscribe((value) => (emitted = value));

    const haircutCheckbox = checkboxByName(root, /haircut/i);
    const coloringCheckbox = checkboxByName(root, /coloring/i);
    expect(haircutCheckbox).toBeTruthy();
    expect(coloringCheckbox).toBeTruthy();

    haircutCheckbox!.click();
    coloringCheckbox!.click();
    await settle(fixture);

    expect(component.saveDisabled()).toBe(false);

    const save = buttonByName(root, /save/i);
    expect(save).toBeTruthy();
    expect(save!.disabled).toBe(false);

    save!.click();
    await settle(fixture);

    expect(emitted?.name).toBe('Ada Lovelace');
    expect(emitted?.email).toBe('ada@example.com');
    expect(emitted?.serviceIds).toEqual(expect.arrayContaining(['s1', 's2']));
    expect(emitted?.serviceIds).toHaveLength(2);
  });

  it('is valid with no services selected and emits an empty serviceIds array', async () => {
    const { fixture, component, root } = await setup({
      initialEmployee: employee({ name: 'Ada Lovelace', email: 'ada@example.com', serviceIds: [] }),
      availableServices: [service({ id: 's1', name: 'Haircut' })],
    });

    let emitted: CreateEmployeePayload | undefined;
    component.save.subscribe((value) => (emitted = value));

    expect(component.saveDisabled()).toBe(false);

    const save = buttonByName(root, /save/i);
    expect(save).toBeTruthy();
    expect(save!.disabled).toBe(false);

    save!.click();
    await settle(fixture);

    expect(emitted).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      serviceIds: [],
    });
  });

  it('reports an accessible error and disables Save for an invalid email', async () => {
    const { fixture, component, root } = await setup({
      initialEmployee: employee({ email: 'nope' }),
    });

    const email = textInputByName(root, /email/i);
    expect(email).toBeTruthy();

    email!.dispatchEvent(new Event('blur'));
    await settle(fixture);

    expect(email!.getAttribute('aria-invalid')).toBe('true');
    expect(describedByMessage(email!, root)).toBeTruthy();
    expect(liveRegions(root).length).toBeGreaterThan(0);

    expect(component.saveDisabled()).toBe(true);

    const save = buttonByName(root, /save/i);
    expect(save).toBeTruthy();
    expect(save!.disabled).toBe(true);
  });

  it('reports an accessible error and disables Save when the name is empty', async () => {
    const { fixture, component, root } = await setup({
      initialEmployee: employee({ name: '' }),
    });

    const name = textInputByName(root, /name/i);
    expect(name).toBeTruthy();

    name!.dispatchEvent(new Event('blur'));
    await settle(fixture);

    expect(name!.getAttribute('aria-invalid')).toBe('true');
    expect(describedByMessage(name!, root)).toBeTruthy();

    expect(component.saveDisabled()).toBe(true);

    const save = buttonByName(root, /save/i);
    expect(save).toBeTruthy();
    expect(save!.disabled).toBe(true);
  });

  it('toggles a service assignment so an unassigned service is excluded from the payload', async () => {
    const haircut = service({ id: 's1', name: 'Haircut' });
    const coloring = service({ id: 's2', name: 'Coloring' });
    const { fixture, component, root } = await setup({
      initialEmployee: employee({ name: 'Ada Lovelace', email: 'ada@example.com', serviceIds: [] }),
      availableServices: [haircut, coloring],
    });

    let emitted: CreateEmployeePayload | undefined;
    component.save.subscribe((value) => (emitted = value));

    expect(checkboxByName(root, /haircut/i)).toBeTruthy();
    expect(checkboxByName(root, /coloring/i)).toBeTruthy();

    checkboxByName(root, /haircut/i)!.click();
    await settle(fixture);
    checkboxByName(root, /coloring/i)!.click();
    await settle(fixture);
    checkboxByName(root, /haircut/i)!.click();
    await settle(fixture);

    const save = buttonByName(root, /save/i);
    expect(save).toBeTruthy();
    save!.click();
    await settle(fixture);

    expect(emitted?.serviceIds).toContain('s2');
    expect(emitted?.serviceIds).not.toContain('s1');
  });

  it('lists every employee with a visible name and an accessible Edit action per row', async () => {
    const ada = employee({ id: 'e1', name: 'Ada Lovelace', email: 'ada@example.com' });
    const grace = employee({ id: 'e2', name: 'Grace Hopper', email: 'grace@example.com' });
    const { fixture, component, root } = await setup({ employees: [ada, grace] });

    expect(root.textContent).toContain('Ada Lovelace');
    expect(root.textContent).toContain('Grace Hopper');

    const editButtons = buttonsByName(root, /edit/i);
    expect(editButtons).toHaveLength(2);
    for (const button of editButtons) {
      const label = `${button.textContent ?? ''} ${button.getAttribute('aria-label') ?? ''}`;
      expect(label.trim().length).toBeGreaterThan(0);
    }

    let edited: Employee | undefined;
    component.edit.subscribe((value) => (edited = value));

    editButtons[0].click();
    await settle(fixture);

    expect(edited).toEqual(ada);
  });

  it('renders an accessible empty state when there are no employees', async () => {
    const { root } = await setup({ employees: [] });

    expect(buttonsByName(root, /edit/i)).toHaveLength(0);

    const emptyState = root.querySelector('[role="status"], [aria-live], .employee-form__empty');
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
