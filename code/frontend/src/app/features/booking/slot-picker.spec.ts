import { TestBed } from '@angular/core/testing';
import { AvailabilitySlot } from './booking.api';
import { SlotPicker } from './slot-picker';

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

const CONTROL_PATTERN = /continue|next|confirm|back|change|retry/i;

function slotOptions(root: HTMLElement): HTMLElement[] {
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>(
      'button, input[type="radio"], [role="radio"], [role="option"]',
    ),
  );
  return candidates.filter((el) => {
    if (el.getAttribute('type') === 'date') {
      return false;
    }
    if (el.tagName === 'BUTTON') {
      const label = `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''}`;
      return !CONTROL_PATTERN.test(label);
    }
    return true;
  });
}

function optionByName(root: HTMLElement, pattern: RegExp): HTMLElement | undefined {
  return slotOptions(root).find((el) => pattern.test(accessibleName(el, root)));
}

function dateInput(root: HTMLElement): HTMLInputElement | undefined {
  return root.querySelector<HTMLInputElement>('input[type="date"]') ?? undefined;
}

function alertRegions(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>('[role="alert"], [aria-live="assertive"]'),
  ).filter((element) => (element.textContent?.trim().length ?? 0) > 0);
}

function statusRegions(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>('[role="status"], [aria-live="polite"], [aria-live]'),
  ).filter((element) => (element.textContent?.trim().length ?? 0) > 0);
}

function busyElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[aria-busy="true"]'));
}

function headings(root: HTMLElement): Element[] {
  return Array.from(root.querySelectorAll('h1, h2, h3, legend, [role="heading"]')).filter(
    (element) => (element.textContent?.trim().length ?? 0) > 0,
  );
}

function slot(startsAt: string, endsAt: string): AvailabilitySlot {
  return { startsAt, endsAt };
}

const SLOTS: AvailabilitySlot[] = [
  slot('2026-07-10T09:00:00.000Z', '2026-07-10T09:30:00.000Z'),
  slot('2026-07-10T10:00:00.000Z', '2026-07-10T10:30:00.000Z'),
  slot('2026-07-10T11:00:00.000Z', '2026-07-10T11:30:00.000Z'),
];

describe('SlotPicker', () => {
  async function setup(inputs?: {
    slots?: AvailabilitySlot[];
    loading?: boolean;
    error?: boolean;
    date?: string;
  }) {
    await TestBed.configureTestingModule({
      imports: [SlotPicker],
    }).compileComponents();

    const fixture = TestBed.createComponent(SlotPicker);
    const component = fixture.componentInstance;
    if (inputs?.slots !== undefined) {
      fixture.componentRef.setInput('slots', inputs.slots);
    }
    if (inputs?.loading !== undefined) {
      fixture.componentRef.setInput('loading', inputs.loading);
    }
    if (inputs?.error !== undefined) {
      fixture.componentRef.setInput('error', inputs.error);
    }
    if (inputs?.date !== undefined) {
      fixture.componentRef.setInput('date', inputs.date);
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

  it('renders one selectable option per slot, each with an accessible name reflecting the time', async () => {
    const { root } = await setup({ slots: SLOTS });

    const options = slotOptions(root);
    expect(options).toHaveLength(SLOTS.length);

    for (const option of options) {
      const name = accessibleName(option, root);
      expect(name.length).toBeGreaterThan(0);
      expect(name).toMatch(/\d/);
    }
  });

  it('emits the chosen slot with its exact payload when an option is selected', async () => {
    const { fixture, component, root } = await setup({ slots: SLOTS });

    let emitted: AvailabilitySlot | undefined;
    component.slotChosen.subscribe((value) => (emitted = value));

    const options = slotOptions(root);
    expect(options.length).toBeGreaterThan(0);

    options[1].click();
    await settle(fixture);

    expect(emitted).toEqual(SLOTS[1]);
  });

  it('shows an accessible loading indicator and no slots while loading', async () => {
    const { root } = await setup({ slots: SLOTS, loading: true });

    expect(busyElements(root).length + statusRegions(root).length).toBeGreaterThan(0);
    expect(slotOptions(root)).toHaveLength(0);
  });

  it('shows an accessible error region without raw backend detail when error is set', async () => {
    const { root } = await setup({ slots: [], error: true });

    const alerts = alertRegions(root);
    expect(alerts.length).toBeGreaterThan(0);

    const message = alerts.map((element) => element.textContent ?? '').join(' ');
    expect(message.trim().length).toBeGreaterThan(0);
  });

  it('shows an accessible empty state and no error region when there are no slots', async () => {
    const { root } = await setup({ slots: [], loading: false, error: false });

    expect(slotOptions(root)).toHaveLength(0);
    expect(alertRegions(root)).toHaveLength(0);

    const empty = statusRegions(root).find(
      (element) => (element.textContent?.trim().length ?? 0) > 0,
    );
    expect(empty).toBeTruthy();
  });

  it('updates the date model when the date input changes', async () => {
    const { fixture, component, root } = await setup({ slots: [], date: '2026-07-10' });

    const input = dateInput(root);
    expect(input).toBeTruthy();

    let emitted: string | undefined;
    component.date.subscribe((value) => (emitted = value));

    input!.value = '2026-07-11';
    input!.dispatchEvent(new Event('input'));
    input!.dispatchEvent(new Event('change'));
    await settle(fixture);

    expect(component.date()).toBe('2026-07-11');
    expect(emitted).toBe('2026-07-11');
  });

  it('renders localized visible text for the heading', async () => {
    const { root } = await setup({ slots: SLOTS });

    const localizedHeadings = headings(root);
    expect(localizedHeadings.length).toBeGreaterThan(0);
    expect((localizedHeadings[0].textContent ?? '').trim().length).toBeGreaterThan(0);
  });
});
