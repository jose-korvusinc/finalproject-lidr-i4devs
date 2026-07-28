import { HttpErrorResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, Subject, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { ScheduleForm } from './schedule-form';
import { SchedulePanel } from './schedule-panel';
import { ScheduleApi, WeeklyScheduleDay } from './schedule.api';

function workingDay(weekday: string, closeTime = '18:00'): WeeklyScheduleDay {
  return {
    weekday,
    isWorkingDay: true,
    openTime: '09:00',
    closeTime,
    breakStart: '14:00',
    breakEnd: '15:00',
  };
}

function offDay(weekday: string): WeeklyScheduleDay {
  return { weekday, isWorkingDay: false };
}

const LOADED_WEEK: WeeklyScheduleDay[] = [
  workingDay('mon'),
  workingDay('tue'),
  workingDay('wed'),
  workingDay('thu'),
  workingDay('fri'),
  offDay('sat'),
  offDay('sun'),
];

function updatedWeek(closeTime: string): WeeklyScheduleDay[] {
  return [
    workingDay('mon', closeTime),
    workingDay('tue', closeTime),
    workingDay('wed', closeTime),
    workingDay('thu', closeTime),
    workingDay('fri', closeTime),
    offDay('sat'),
    offDay('sun'),
  ];
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

interface ScheduleApiDouble {
  getSchedule: Mock<() => Observable<WeeklyScheduleDay[]>>;
  saveSchedule: Mock<(days: WeeklyScheduleDay[]) => Observable<WeeklyScheduleDay[]>>;
}

describe('SchedulePanel', () => {
  async function setup(overrides?: Partial<ScheduleApiDouble>) {
    const apiDouble: ScheduleApiDouble = {
      getSchedule: vi.fn<() => Observable<WeeklyScheduleDay[]>>(() => of(LOADED_WEEK)),
      saveSchedule: vi.fn<(days: WeeklyScheduleDay[]) => Observable<WeeklyScheduleDay[]>>((days) =>
        of(days),
      ),
      ...overrides,
    };

    await TestBed.configureTestingModule({
      imports: [SchedulePanel, ScheduleForm],
      providers: [{ provide: ScheduleApi, useValue: apiDouble }],
    }).compileComponents();

    const fixture = TestBed.createComponent(SchedulePanel);
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

  function formElement(fixture: Awaited<ReturnType<typeof setup>>['fixture']): DebugElement | null {
    return fixture.debugElement.query(By.directive(ScheduleForm));
  }

  it('loads the schedule once on init and seeds the form with the returned days', async () => {
    const gate = new Subject<WeeklyScheduleDay[]>();
    const { fixture, root, apiDouble } = await setup({
      getSchedule: vi.fn<() => Observable<WeeklyScheduleDay[]>>(() => gate.asObservable()),
    });

    expect(apiDouble.getSchedule).toHaveBeenCalledTimes(1);
    expect(busyElements(root).length + statusRegions(root).length).toBeGreaterThan(0);

    gate.next(LOADED_WEEK);
    gate.complete();
    await settle(fixture);

    const form = formElement(fixture);
    expect(form).toBeTruthy();
    const child = form!.componentInstance as ScheduleForm;
    expect(child.initialSchedule()).toEqual(LOADED_WEEK);
  });

  it('renders the form for an empty schedule without showing an error', async () => {
    const { fixture, root } = await setup({
      getSchedule: vi.fn<() => Observable<WeeklyScheduleDay[]>>(() => of([])),
    });
    await settle(fixture);

    expect(formElement(fixture)).toBeTruthy();
    expect(alertRegions(root)).toHaveLength(0);
  });

  it('shows an accessible error and no raw backend message when loading fails', async () => {
    const { fixture, root } = await setup({
      getSchedule: vi.fn<() => Observable<WeeklyScheduleDay[]>>(() =>
        throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' })),
      ),
    });
    await settle(fixture);

    const alerts = alertRegions(root);
    expect(alerts.length).toBeGreaterThan(0);

    const message = alerts.map((element) => element.textContent ?? '').join(' ');
    expect(message.trim().length).toBeGreaterThan(0);
    expect(message).not.toMatch(/HttpErrorResponse/);
    expect(message).not.toMatch(/500/);
  });

  it('saves the emitted days once and confirms the save accessibly on success (AC1)', async () => {
    const { fixture, root, apiDouble } = await setup();
    await settle(fixture);

    const form = formElement(fixture);
    expect(form).toBeTruthy();

    const child = form!.componentInstance as ScheduleForm;
    child.save.emit(LOADED_WEEK);
    await settle(fixture);

    expect(apiDouble.saveSchedule).toHaveBeenCalledTimes(1);
    expect(apiDouble.saveSchedule).toHaveBeenCalledWith(LOADED_WEEK);

    const confirmation = [...statusRegions(root), ...alertRegions(root)].find(
      (element) => (element.textContent?.trim().length ?? 0) > 0,
    );
    expect(confirmation).toBeTruthy();
    const announceable =
      confirmation!.getAttribute('aria-live') !== null ||
      confirmation!.getAttribute('role') === 'status' ||
      confirmation!.getAttribute('role') === 'alert';
    expect(announceable).toBe(true);
  });

  it('reflects an accessible saving state while the save is in flight', async () => {
    const gate = new Subject<WeeklyScheduleDay[]>();
    const { fixture, root } = await setup({
      saveSchedule: vi.fn<(days: WeeklyScheduleDay[]) => Observable<WeeklyScheduleDay[]>>(() =>
        gate.asObservable(),
      ),
    });
    await settle(fixture);

    const form = formElement(fixture);
    expect(form).toBeTruthy();

    const child = form!.componentInstance as ScheduleForm;
    child.save.emit(LOADED_WEEK);
    await settle(fixture);

    expect(busyElements(root).length).toBeGreaterThan(0);

    gate.next(LOADED_WEEK);
    gate.complete();
    await settle(fixture);
  });

  it('shows an accessible error on save failure and keeps the form available to retry', async () => {
    const { fixture, root } = await setup({
      saveSchedule: vi.fn<(days: WeeklyScheduleDay[]) => Observable<WeeklyScheduleDay[]>>(() =>
        throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' })),
      ),
    });
    await settle(fixture);

    const form = formElement(fixture);
    expect(form).toBeTruthy();

    const child = form!.componentInstance as ScheduleForm;
    child.save.emit(LOADED_WEEK);
    await settle(fixture);

    const alerts = alertRegions(root);
    expect(alerts.length).toBeGreaterThan(0);
    const message = alerts.map((element) => element.textContent ?? '').join(' ');
    expect(message).not.toMatch(/HttpErrorResponse/);
    expect(message).not.toMatch(/500/);

    expect(formElement(fixture)).toBeTruthy();
  });

  it('re-saves the updated schedule without duplicating the week on a second save (AC2)', async () => {
    const { fixture, root, apiDouble } = await setup();
    await settle(fixture);

    const firstForm = formElement(fixture);
    expect(firstForm).toBeTruthy();
    (firstForm!.componentInstance as ScheduleForm).save.emit(LOADED_WEEK);
    await settle(fixture);

    const nextForm = formElement(fixture);
    expect(nextForm).toBeTruthy();
    const changed = updatedWeek('17:00');
    (nextForm!.componentInstance as ScheduleForm).save.emit(changed);
    await settle(fixture);

    expect(apiDouble.saveSchedule).toHaveBeenCalledTimes(2);
    expect(apiDouble.saveSchedule).toHaveBeenLastCalledWith(changed);

    const lastArg = apiDouble.saveSchedule.mock.calls.at(-1)![0];
    expect(lastArg).toHaveLength(7);
    expect(new Set(lastArg.map((day) => day.weekday)).size).toBe(7);

    const confirmation = [...statusRegions(root), ...alertRegions(root)].find(
      (element) => (element.textContent?.trim().length ?? 0) > 0,
    );
    expect(confirmation).toBeTruthy();
  });
});
