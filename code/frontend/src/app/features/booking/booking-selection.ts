import { Component, computed, input, output, signal } from '@angular/core';

export type BookingService = { id: string; name: string };
export type BookingEmployee = { id: string; name: string; serviceIds: string[] };

@Component({
  selector: 'app-booking-selection',
  templateUrl: './booking-selection.html',
  styleUrl: './booking-selection.scss',
})
export class BookingSelection {
  readonly services = input<BookingService[]>([]);
  readonly employees = input<BookingEmployee[]>([]);

  readonly serviceId = signal<string | null>(null);
  readonly employeeId = signal<string | null>(null);

  readonly eligibleEmployees = computed<BookingEmployee[]>(() => {
    const currentServiceId = this.serviceId();
    if (!currentServiceId) {
      return [];
    }
    return this.employees().filter((employee) => employee.serviceIds.includes(currentServiceId));
  });

  readonly canContinue = computed(() => this.serviceId() !== null && this.employeeId() !== null);

  readonly selected = output<{ serviceId: string; employeeId: string }>();

  chooseService(id: string): void {
    if (this.serviceId() === id) {
      return;
    }
    this.serviceId.set(id);
    this.employeeId.set(null);
  }

  chooseEmployee(id: string): void {
    this.employeeId.set(id);
  }

  continue(): void {
    const serviceId = this.serviceId();
    const employeeId = this.employeeId();
    if (serviceId === null || employeeId === null) {
      return;
    }
    this.selected.emit({ serviceId, employeeId });
  }
}
