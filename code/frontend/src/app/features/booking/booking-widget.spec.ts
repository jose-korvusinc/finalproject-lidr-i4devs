import { HttpErrorResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, Subject, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { CatalogApi, Employee, Service } from '../catalog/catalog.api';
import {
  AvailabilityQuery,
  AvailabilitySlot,
  BookingApi,
  BookingCustomer,
  BookingRequest,
  BookingResult,
} from './booking.api';
import { BookingEmployee, BookingSelection, BookingService } from './booking-selection';
import { BookingWidget } from './booking-widget';
import { ContactForm } from './contact-form';
import { SlotPicker } from './slot-picker';

const SERVICES: Service[] = [
  { id: 's1', name: 'Corte de pelo', price: '25.00', durationMinutes: 30, active: true },
  { id: 's2', name: 'Coloracion', price: '40.00', durationMinutes: 60, active: true },
];

const EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Ada Lovelace', email: 'ada@example.com', serviceIds: ['s1', 's2'] },
];

const MAPPED_SERVICES: BookingService[] = [
  { id: 's1', name: 'Corte de pelo' },
  { id: 's2', name: 'Coloracion' },
];

const MAPPED_EMPLOYEES: BookingEmployee[] = [
  { id: 'e1', name: 'Ada Lovelace', serviceIds: ['s1', 's2'] },
];

const SLOTS: AvailabilitySlot[] = [
  { startsAt: '2026-07-10T09:00:00.000Z', endsAt: '2026-07-10T09:30:00.000Z' },
  { startsAt: '2026-07-10T10:00:00.000Z', endsAt: '2026-07-10T10:30:00.000Z' },
  { startsAt: '2026-07-10T11:00:00.000Z', endsAt: '2026-07-10T11:30:00.000Z' },
];

const SELECTION = { serviceId: 's1', employeeId: 'e1' };

const CUSTOMER: BookingCustomer = {
  name: 'Grace Hopper',
  email: 'grace@example.com',
  phone: '+34600111222',
};

const BOOKING_RESULT: BookingResult = {
  id: 'b1',
  status: 'pending',
  startsAt: SLOTS[1].startsAt,
};

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

interface CatalogApiDouble {
  listServices: Mock<() => Observable<Service[]>>;
  listEmployees: Mock<() => Observable<Employee[]>>;
}

interface BookingApiDouble {
  getAvailability: Mock<(query: AvailabilityQuery) => Observable<AvailabilitySlot[]>>;
  createBooking: Mock<(request: BookingRequest) => Observable<BookingResult>>;
}

describe('BookingWidget', () => {
  async function setup(overrides?: {
    catalog?: Partial<CatalogApiDouble>;
    booking?: Partial<BookingApiDouble>;
  }) {
    const catalogDouble: CatalogApiDouble = {
      listServices: vi.fn<() => Observable<Service[]>>(() => of(SERVICES)),
      listEmployees: vi.fn<() => Observable<Employee[]>>(() => of(EMPLOYEES)),
      ...overrides?.catalog,
    };

    const bookingDouble: BookingApiDouble = {
      getAvailability: vi.fn<(query: AvailabilityQuery) => Observable<AvailabilitySlot[]>>(() =>
        of(SLOTS),
      ),
      createBooking: vi.fn<(request: BookingRequest) => Observable<BookingResult>>(() =>
        of(BOOKING_RESULT),
      ),
      ...overrides?.booking,
    };

    await TestBed.configureTestingModule({
      imports: [BookingWidget, BookingSelection, SlotPicker, ContactForm],
      providers: [
        { provide: CatalogApi, useValue: catalogDouble },
        { provide: BookingApi, useValue: bookingDouble },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(BookingWidget);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return { fixture, component, root, catalogDouble, bookingDouble };
  }

  type Ctx = Awaited<ReturnType<typeof setup>>;

  async function settle(fixture: Ctx['fixture']) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function selectionEl(fixture: Ctx['fixture']): DebugElement | null {
    return fixture.debugElement.query(By.directive(BookingSelection));
  }

  function slotPickerEl(fixture: Ctx['fixture']): DebugElement | null {
    return fixture.debugElement.query(By.directive(SlotPicker));
  }

  function contactFormEl(fixture: Ctx['fixture']): DebugElement | null {
    return fixture.debugElement.query(By.directive(ContactForm));
  }

  async function reachSlots(ctx: Ctx) {
    const selection = selectionEl(ctx.fixture);
    expect(selection).toBeTruthy();
    (selection!.componentInstance as BookingSelection).selected.emit(SELECTION);
    await settle(ctx.fixture);
  }

  async function reachContact(ctx: Ctx) {
    await reachSlots(ctx);
    const picker = slotPickerEl(ctx.fixture);
    expect(picker).toBeTruthy();
    (picker!.componentInstance as SlotPicker).slotChosen.emit(SLOTS[1]);
    await settle(ctx.fixture);
  }

  it('loads services and employees once on init and renders the selection step with mapped data', async () => {
    const ctx = await setup();
    await settle(ctx.fixture);

    expect(ctx.catalogDouble.listServices).toHaveBeenCalledTimes(1);
    expect(ctx.catalogDouble.listEmployees).toHaveBeenCalledTimes(1);

    const selection = selectionEl(ctx.fixture);
    expect(selection).toBeTruthy();

    const child = selection!.componentInstance as BookingSelection;
    expect(child.services()).toEqual(MAPPED_SERVICES);
    expect(child.employees()).toEqual(MAPPED_EMPLOYEES);
  });

  it('requests availability for the chosen service and employee and renders the slot step', async () => {
    const ctx = await setup();
    await settle(ctx.fixture);

    await reachSlots(ctx);

    expect(ctx.bookingDouble.getAvailability).toHaveBeenCalledTimes(1);
    const query = ctx.bookingDouble.getAvailability.mock.calls[0][0];
    expect(query.serviceId).toBe(SELECTION.serviceId);
    expect(query.employeeId).toBe(SELECTION.employeeId);
    expect(typeof query.date).toBe('string');

    const picker = slotPickerEl(ctx.fixture);
    expect(picker).toBeTruthy();
    expect((picker!.componentInstance as SlotPicker).slots()).toEqual(SLOTS);
  });

  it('advances to the contact step when a slot is chosen', async () => {
    const ctx = await setup();
    await settle(ctx.fixture);

    await reachContact(ctx);

    expect(contactFormEl(ctx.fixture)).toBeTruthy();
  });

  it('creates the booking once with the exact payload and shows an accessible confirmation on 201', async () => {
    const ctx = await setup();
    await settle(ctx.fixture);

    await reachContact(ctx);

    const contact = contactFormEl(ctx.fixture);
    expect(contact).toBeTruthy();
    (contact!.componentInstance as ContactForm).confirmed.emit(CUSTOMER);
    await settle(ctx.fixture);

    expect(ctx.bookingDouble.createBooking).toHaveBeenCalledTimes(1);
    const request = ctx.bookingDouble.createBooking.mock.calls[0][0];
    expect(request).toEqual({
      serviceId: SELECTION.serviceId,
      employeeId: SELECTION.employeeId,
      startsAt: SLOTS[1].startsAt,
      customer: CUSTOMER,
    });

    const confirmation = statusRegions(ctx.root);
    expect(confirmation.length).toBeGreaterThan(0);
    expect(
      confirmation
        .map((element) => element.textContent ?? '')
        .join(' ')
        .trim().length,
    ).toBeGreaterThan(0);
  });

  it('on a 409 conflict shows an accessible alert without raw detail and returns to slot selection', async () => {
    const ctx = await setup({
      booking: {
        createBooking: vi.fn<(request: BookingRequest) => Observable<BookingResult>>(() =>
          throwError(() => new HttpErrorResponse({ status: 409, statusText: 'Conflict' })),
        ),
      },
    });
    await settle(ctx.fixture);

    await reachContact(ctx);

    const contact = contactFormEl(ctx.fixture);
    expect(contact).toBeTruthy();
    (contact!.componentInstance as ContactForm).confirmed.emit(CUSTOMER);
    await settle(ctx.fixture);

    const alerts = alertRegions(ctx.root);
    expect(alerts.length).toBeGreaterThan(0);
    const message = alerts.map((element) => element.textContent ?? '').join(' ');
    expect(message.trim().length).toBeGreaterThan(0);
    expect(message).not.toMatch(/HttpErrorResponse/);
    expect(message).not.toMatch(/409/);

    expect(slotPickerEl(ctx.fixture)).toBeTruthy();
  });

  it('reflects an accessible busy state while the booking creation is in flight', async () => {
    const gate = new Subject<BookingResult>();
    const ctx = await setup({
      booking: {
        createBooking: vi.fn<(request: BookingRequest) => Observable<BookingResult>>(() =>
          gate.asObservable(),
        ),
      },
    });
    await settle(ctx.fixture);

    await reachContact(ctx);

    const contact = contactFormEl(ctx.fixture);
    expect(contact).toBeTruthy();
    (contact!.componentInstance as ContactForm).confirmed.emit(CUSTOMER);
    await settle(ctx.fixture);

    expect(busyElements(ctx.root).length).toBeGreaterThan(0);

    gate.next(BOOKING_RESULT);
    gate.complete();
    await settle(ctx.fixture);
  });

  it('on a generic 500 error shows an accessible alert without raw detail and allows retrying', async () => {
    const ctx = await setup({
      booking: {
        createBooking: vi.fn<(request: BookingRequest) => Observable<BookingResult>>(() =>
          throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' })),
        ),
      },
    });
    await settle(ctx.fixture);

    await reachContact(ctx);

    const contact = contactFormEl(ctx.fixture);
    expect(contact).toBeTruthy();
    (contact!.componentInstance as ContactForm).confirmed.emit(CUSTOMER);
    await settle(ctx.fixture);

    const alerts = alertRegions(ctx.root);
    expect(alerts.length).toBeGreaterThan(0);
    const message = alerts.map((element) => element.textContent ?? '').join(' ');
    expect(message).not.toMatch(/HttpErrorResponse/);
    expect(message).not.toMatch(/500/);

    expect(contactFormEl(ctx.fixture)).toBeTruthy();
  });
});
