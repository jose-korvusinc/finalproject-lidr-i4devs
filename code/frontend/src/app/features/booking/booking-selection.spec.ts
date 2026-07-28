import { TestBed } from '@angular/core/testing';
import { BookingEmployee, BookingSelection, BookingService } from './booking-selection';

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
  return (el.textContent ?? '').trim();
}

const CONTROL_PATTERN = /continue|next|confirm|back/i;

function selectableOptions(root: HTMLElement): HTMLElement[] {
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>(
      'button, input[type="radio"], [role="radio"], [role="option"]',
    ),
  );
  return candidates.filter((el) => {
    if (el.tagName === 'BUTTON') {
      const label = `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''}`;
      return !CONTROL_PATTERN.test(label);
    }
    return true;
  });
}

function optionByName(root: HTMLElement, pattern: RegExp): HTMLElement | undefined {
  return selectableOptions(root).find((el) => pattern.test(accessibleName(el, root)));
}

function controlButton(root: HTMLElement, pattern: RegExp): HTMLButtonElement | undefined {
  return Array.from(root.querySelectorAll('button')).find((button) => {
    const label = `${button.textContent ?? ''} ${button.getAttribute('aria-label') ?? ''}`;
    return pattern.test(label);
  });
}

function choose(root: HTMLElement, pattern: RegExp): void {
  const option = optionByName(root, pattern);
  expect(option).toBeTruthy();
  option!.click();
}

function headings(root: HTMLElement): Element[] {
  return Array.from(root.querySelectorAll('h1, h2, h3, legend, [role="heading"]')).filter(
    (element) => (element.textContent?.trim().length ?? 0) > 0,
  );
}

function bookingService(overrides: Partial<BookingService> = {}): BookingService {
  return { id: 's1', name: 'Haircut', ...overrides };
}

function bookingEmployee(overrides: Partial<BookingEmployee> = {}): BookingEmployee {
  return { id: 'e1', name: 'Ada Lovelace', serviceIds: ['s1'], ...overrides };
}

describe('BookingSelection', () => {
  async function setup(inputs?: { services?: BookingService[]; employees?: BookingEmployee[] }) {
    await TestBed.configureTestingModule({
      imports: [BookingSelection],
    }).compileComponents();

    const fixture = TestBed.createComponent(BookingSelection);
    const component = fixture.componentInstance;
    if (inputs?.services !== undefined) {
      fixture.componentRef.setInput('services', inputs.services);
    }
    if (inputs?.employees !== undefined) {
      fixture.componentRef.setInput('employees', inputs.employees);
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

  it('renders one selectable option per service, each with an accessible name', async () => {
    const haircut = bookingService({ id: 's1', name: 'Haircut' });
    const coloring = bookingService({ id: 's2', name: 'Coloring' });
    const { root } = await setup({ services: [haircut, coloring], employees: [] });

    const options = selectableOptions(root);
    expect(options).toHaveLength(2);

    const haircutOption = optionByName(root, /haircut/i);
    const coloringOption = optionByName(root, /coloring/i);
    expect(haircutOption).toBeTruthy();
    expect(coloringOption).toBeTruthy();

    for (const option of [haircutOption, coloringOption]) {
      expect(accessibleName(option!, root).length).toBeGreaterThan(0);
    }
  });

  it('shows only employees qualified for the chosen service and hides the others', async () => {
    const haircut = bookingService({ id: 's1', name: 'Haircut' });
    const coloring = bookingService({ id: 's2', name: 'Coloring' });
    const ada = bookingEmployee({ id: 'e1', name: 'Ada Lovelace', serviceIds: ['s1'] });
    const grace = bookingEmployee({ id: 'e2', name: 'Grace Hopper', serviceIds: ['s2'] });
    const { fixture, root } = await setup({
      services: [haircut, coloring],
      employees: [ada, grace],
    });

    choose(root, /haircut/i);
    await settle(fixture);

    expect(optionByName(root, /ada lovelace/i)).toBeTruthy();
    expect(optionByName(root, /grace hopper/i)).toBeFalsy();
  });

  it('recomputes eligible employees when the chosen service changes', async () => {
    const haircut = bookingService({ id: 's1', name: 'Haircut' });
    const coloring = bookingService({ id: 's2', name: 'Coloring' });
    const ada = bookingEmployee({ id: 'e1', name: 'Ada Lovelace', serviceIds: ['s1'] });
    const grace = bookingEmployee({ id: 'e2', name: 'Grace Hopper', serviceIds: ['s2'] });
    const { fixture, root } = await setup({
      services: [haircut, coloring],
      employees: [ada, grace],
    });

    choose(root, /haircut/i);
    await settle(fixture);

    expect(optionByName(root, /ada lovelace/i)).toBeTruthy();
    expect(optionByName(root, /grace hopper/i)).toBeFalsy();

    choose(root, /coloring/i);
    await settle(fixture);

    expect(optionByName(root, /grace hopper/i)).toBeTruthy();
    expect(optionByName(root, /ada lovelace/i)).toBeFalsy();
  });

  it('keeps Continue disabled until a service and an eligible employee are chosen', async () => {
    const haircut = bookingService({ id: 's1', name: 'Haircut' });
    const ada = bookingEmployee({ id: 'e1', name: 'Ada Lovelace', serviceIds: ['s1'] });
    const { fixture, root } = await setup({ services: [haircut], employees: [ada] });

    const initialContinue = controlButton(root, /continue/i);
    expect(initialContinue).toBeTruthy();
    expect(initialContinue!.disabled).toBe(true);

    choose(root, /haircut/i);
    await settle(fixture);

    expect(controlButton(root, /continue/i)!.disabled).toBe(true);

    choose(root, /ada lovelace/i);
    await settle(fixture);

    expect(controlButton(root, /continue/i)!.disabled).toBe(false);
  });

  it('emits the chosen service and employee when Continue is pressed', async () => {
    const haircut = bookingService({ id: 's1', name: 'Haircut' });
    const coloring = bookingService({ id: 's2', name: 'Coloring' });
    const ada = bookingEmployee({ id: 'e1', name: 'Ada Lovelace', serviceIds: ['s1'] });
    const grace = bookingEmployee({ id: 'e2', name: 'Grace Hopper', serviceIds: ['s2'] });
    const { fixture, component, root } = await setup({
      services: [haircut, coloring],
      employees: [ada, grace],
    });

    let emitted: { serviceId: string; employeeId: string } | undefined;
    component.selected.subscribe((value) => (emitted = value));

    choose(root, /haircut/i);
    await settle(fixture);
    choose(root, /ada lovelace/i);
    await settle(fixture);

    const proceed = controlButton(root, /continue/i);
    expect(proceed).toBeTruthy();
    expect(proceed!.disabled).toBe(false);

    proceed!.click();
    await settle(fixture);

    expect(emitted).toEqual({ serviceId: 's1', employeeId: 'e1' });
  });

  it('renders localized visible text for the heading and the Continue action', async () => {
    const { root } = await setup({
      services: [bookingService({ id: 's1', name: 'Haircut' })],
      employees: [],
    });

    expect(headings(root).length).toBeGreaterThan(0);

    const proceed = controlButton(root, /continue/i);
    expect(proceed).toBeTruthy();
    expect((proceed!.textContent ?? '').trim().length).toBeGreaterThan(0);
  });
});
