import { TestBed } from '@angular/core/testing';
import { ScheduleForm } from './schedule-form';
import { WeeklyScheduleDay } from './schedule.api';

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

function checkboxes(root: HTMLElement): HTMLInputElement[] {
  return Array.from(root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
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

function workingDay(weekday: string): WeeklyScheduleDay {
  return {
    weekday,
    isWorkingDay: true,
    openTime: '09:00',
    closeTime: '18:00',
    breakStart: '14:00',
    breakEnd: '15:00',
  };
}

function offDay(weekday: string): WeeklyScheduleDay {
  return { weekday, isWorkingDay: false };
}

const VALID_WEEK: WeeklyScheduleDay[] = [
  workingDay('mon'),
  workingDay('tue'),
  workingDay('wed'),
  workingDay('thu'),
  workingDay('fri'),
  offDay('sat'),
  offDay('sun'),
];

const ALL_OFF_WEEK: WeeklyScheduleDay[] = [
  offDay('mon'),
  offDay('tue'),
  offDay('wed'),
  offDay('thu'),
  offDay('fri'),
  offDay('sat'),
  offDay('sun'),
];

describe('ScheduleForm', () => {
  async function setup(initial?: WeeklyScheduleDay[]) {
    await TestBed.configureTestingModule({
      imports: [ScheduleForm],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScheduleForm);
    const component = fixture.componentInstance;
    if (initial) {
      fixture.componentRef.setInput('initialSchedule', initial);
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

  it('renders a working-day toggle for each of the seven weekdays with an accessible name', async () => {
    const { root } = await setup();

    const toggles = checkboxes(root);
    expect(toggles).toHaveLength(7);
    for (const toggle of toggles) {
      expect(accessibleName(toggle, root).length).toBeGreaterThan(0);
    }
  });

  it('renders open, close, break-start and break-end inputs with accessible names for a working day', async () => {
    const { root } = await setup([
      workingDay('mon'),
      offDay('tue'),
      offDay('wed'),
      offDay('thu'),
      offDay('fri'),
      offDay('sat'),
      offDay('sun'),
    ]);

    const open = inputByName(root, /open/i);
    const close = inputByName(root, /close/i);
    const breakStart = inputByName(root, /break.*start|start.*break/i);
    const breakEnd = inputByName(root, /break.*end|end.*break/i);

    expect(open).toBeTruthy();
    expect(close).toBeTruthy();
    expect(breakStart).toBeTruthy();
    expect(breakEnd).toBeTruthy();

    for (const control of [open, close, breakStart, breakEnd]) {
      expect(accessibleName(control!, root).length).toBeGreaterThan(0);
    }
  });

  it('is valid for a Monday-to-Friday 09:00-18:00 schedule with a 14:00-15:00 break and emits it on Save', async () => {
    const { fixture, component, root } = await setup(VALID_WEEK);

    let emitted: WeeklyScheduleDay[] | undefined;
    component.save.subscribe((value) => (emitted = value));

    expect(component.saveDisabled()).toBe(false);

    const save = buttonByName(root, /save/i);
    expect(save).toBeTruthy();
    expect(save!.disabled).toBe(false);

    save!.click();
    await settle(fixture);

    expect(emitted).toBeTruthy();
    expect(emitted).toHaveLength(7);

    const working = emitted!.filter((day) => day.isWorkingDay);
    expect(working).toHaveLength(5);
    for (const day of working) {
      expect(day.openTime).toBe('09:00');
      expect(day.closeTime).toBe('18:00');
      expect(day.breakStart).toBe('14:00');
      expect(day.breakEnd).toBe('15:00');
    }
  });

  it('omits the break fields instead of emitting empty strings when the day has no break', async () => {
    const { fixture, component, root } = await setup([
      { weekday: 'mon', isWorkingDay: true, openTime: '09:00', closeTime: '18:00' },
      offDay('tue'),
      offDay('wed'),
      offDay('thu'),
      offDay('fri'),
      offDay('sat'),
      offDay('sun'),
    ]);

    let emitted: WeeklyScheduleDay[] | undefined;
    component.save.subscribe((value) => (emitted = value));

    expect(component.saveDisabled()).toBe(false);
    buttonByName(root, /save/i)!.click();
    await settle(fixture);

    const monday = emitted!.find((day) => day.weekday === 'mon');
    expect(monday).toEqual({
      weekday: 'mon',
      isWorkingDay: true,
      openTime: '09:00',
      closeTime: '18:00',
    });
    expect(monday).not.toHaveProperty('breakStart');
    expect(monday).not.toHaveProperty('breakEnd');
  });

  it('omits the time fields of a non-working day', async () => {
    const { fixture, component, root } = await setup(ALL_OFF_WEEK);

    let emitted: WeeklyScheduleDay[] | undefined;
    component.save.subscribe((value) => (emitted = value));

    buttonByName(root, /save/i)!.click();
    await settle(fixture);

    for (const day of emitted!) {
      expect(day).toEqual({ weekday: day.weekday, isWorkingDay: false });
    }
  });

  it('reports an accessible error and disables Save when the break falls outside working hours', async () => {
    const { fixture, root } = await setup([
      {
        weekday: 'mon',
        isWorkingDay: true,
        openTime: '09:00',
        closeTime: '18:00',
        breakStart: '14:00',
        breakEnd: '19:00',
      },
      offDay('tue'),
      offDay('wed'),
      offDay('thu'),
      offDay('fri'),
      offDay('sat'),
      offDay('sun'),
    ]);

    const breakEnd = inputByName(root, /break.*end|end.*break/i);
    expect(breakEnd).toBeTruthy();

    breakEnd!.dispatchEvent(new Event('blur'));
    await settle(fixture);

    const invalid = invalidControls(root);
    expect(invalid.length).toBeGreaterThan(0);

    const flagged = invalid.find((element) => describedByMessage(element, root));
    expect(flagged).toBeTruthy();
    expect(describedByMessage(flagged!, root)).toBeTruthy();

    expect(liveRegions(root).length).toBeGreaterThan(0);

    const component = fixture.componentInstance;
    expect(component.saveDisabled()).toBe(true);

    const save = buttonByName(root, /save/i);
    expect(save).toBeTruthy();
    expect(save!.disabled).toBe(true);
  });

  it('reports an accessible error and disables Save when the open time is not before the close time', async () => {
    const { fixture, component, root } = await setup([
      { weekday: 'mon', isWorkingDay: true, openTime: '18:00', closeTime: '09:00' },
      offDay('tue'),
      offDay('wed'),
      offDay('thu'),
      offDay('fri'),
      offDay('sat'),
      offDay('sun'),
    ]);

    const open = inputByName(root, /open/i);
    const close = inputByName(root, /close/i);
    expect(open).toBeTruthy();
    expect(close).toBeTruthy();

    open!.dispatchEvent(new Event('blur'));
    close!.dispatchEvent(new Event('blur'));
    await settle(fixture);

    expect(invalidControls(root).length).toBeGreaterThan(0);
    expect(component.saveDisabled()).toBe(true);

    const save = buttonByName(root, /save/i);
    expect(save!.disabled).toBe(true);
  });

  it('does not raise hour errors when every day is marked as non-working', async () => {
    const { root } = await setup(ALL_OFF_WEEK);

    const toggles = checkboxes(root);
    expect(toggles).toHaveLength(7);

    expect(invalidControls(root)).toHaveLength(0);
    expect(liveRegions(root)).toHaveLength(0);
  });

  it('renders localized visible text for the Save action and the day toggles', async () => {
    const { root } = await setup();

    const save = buttonByName(root, /save/i);
    expect(save).toBeTruthy();
    expect((save!.textContent ?? '').trim().length).toBeGreaterThan(0);

    const toggles = checkboxes(root);
    expect(toggles.length).toBeGreaterThan(0);
    expect(accessibleName(toggles[0], root).length).toBeGreaterThan(0);
  });
});
