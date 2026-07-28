import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { CatalogApi } from '../catalog/catalog.api';
import { AvailabilitySlot, BookingApi, BookingCustomer } from './booking.api';
import { BookingEmployee, BookingSelection, BookingService } from './booking-selection';
import { ContactForm } from './contact-form';
import { SlotPicker } from './slot-picker';

type Step = 'select' | 'slots' | 'contact' | 'confirmed' | 'conflict';
type SubmitState = 'idle' | 'submitting' | 'error';
type Selection = { serviceId: string; employeeId: string };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-booking-widget',
  templateUrl: './booking-widget.html',
  styleUrl: './booking-widget.scss',
  imports: [BookingSelection, SlotPicker, ContactForm],
})
export class BookingWidget {
  private readonly catalogApi = inject(CatalogApi);
  private readonly bookingApi = inject(BookingApi);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly step = signal<Step>('select');
  protected readonly services = signal<BookingService[]>([]);
  protected readonly employees = signal<BookingEmployee[]>([]);
  protected readonly slots = signal<AvailabilitySlot[]>([]);
  protected readonly loadingSlots = signal<boolean>(false);
  protected readonly slotsError = signal<boolean>(false);
  protected readonly selection = signal<Selection | null>(null);
  protected readonly chosenSlot = signal<AvailabilitySlot | null>(null);
  protected readonly submitState = signal<SubmitState>('idle');
  protected readonly date = signal<string>(today());

  constructor() {
    forkJoin({
      services: this.catalogApi.listServices(),
      employees: this.catalogApi.listEmployees(),
    })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: ({ services, employees }) => {
          this.services.set(services.map((service) => ({ id: service.id, name: service.name })));
          this.employees.set(
            employees.map((employee) => ({
              id: employee.id,
              name: employee.name,
              serviceIds: employee.serviceIds,
            })),
          );
        },
      });
  }

  onSelected(selection: Selection): void {
    this.selection.set(selection);
    this.step.set('slots');
    this.loadAvailability();
  }

  onDateChanged(date: string): void {
    this.date.set(date);
    if (this.selection()) {
      this.loadAvailability();
    }
  }

  onSlotChosen(slot: AvailabilitySlot): void {
    this.chosenSlot.set(slot);
    this.submitState.set('idle');
    this.step.set('contact');
  }

  onConfirmed(customer: BookingCustomer): void {
    const selection = this.selection();
    const slot = this.chosenSlot();
    if (!selection || !slot) {
      return;
    }
    this.submitState.set('submitting');
    this.bookingApi
      .createBooking({
        serviceId: selection.serviceId,
        employeeId: selection.employeeId,
        startsAt: slot.startsAt,
        customer,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitState.set('idle');
          this.step.set('confirmed');
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 409) {
            this.submitState.set('idle');
            this.step.set('conflict');
            return;
          }
          this.submitState.set('error');
        },
      });
  }

  private loadAvailability(): void {
    const selection = this.selection();
    if (!selection) {
      return;
    }
    this.loadingSlots.set(true);
    this.slotsError.set(false);
    this.bookingApi
      .getAvailability({
        serviceId: selection.serviceId,
        employeeId: selection.employeeId,
        date: this.date(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (slots) => {
          this.slots.set(slots);
          this.loadingSlots.set(false);
        },
        error: () => {
          this.slotsError.set(true);
          this.loadingSlots.set(false);
        },
      });
  }
}
