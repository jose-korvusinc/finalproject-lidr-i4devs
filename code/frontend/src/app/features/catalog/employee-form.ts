import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { CreateEmployeePayload, Employee, Service } from './catalog.api';

interface EmployeeModel {
  name: string;
  email: string;
  serviceIds: string[];
}

function toModel(seed: Employee | null | undefined): EmployeeModel {
  return {
    name: seed?.name ?? '',
    email: seed?.email ?? '',
    serviceIds: seed?.serviceIds ? [...seed.serviceIds] : [],
  };
}

@Component({
  selector: 'app-employee-form',
  imports: [FormField],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.scss',
})
export class EmployeeForm {
  readonly initialEmployee = input<Employee | null>();
  readonly employees = input<Employee[]>([]);
  readonly availableServices = input<Service[]>([]);

  readonly model = linkedSignal<EmployeeModel>(() => toModel(this.initialEmployee()));

  readonly form = form(this.model, (path) => {
    required(path.name);
    required(path.email);
    email(path.email);
  });

  readonly saveDisabled = computed<boolean>(() => this.form().invalid());

  readonly save = output<CreateEmployeePayload>();
  readonly edit = output<Employee>();

  isAssigned(serviceId: string): boolean {
    return this.model().serviceIds.includes(serviceId);
  }

  toggleService(serviceId: string): void {
    this.model.update((value) => {
      const assigned = value.serviceIds.includes(serviceId);
      const serviceIds = assigned
        ? value.serviceIds.filter((id) => id !== serviceId)
        : [...value.serviceIds, serviceId];
      return { ...value, serviceIds };
    });
  }

  onSave(): void {
    if (this.form().invalid()) {
      return;
    }
    const value = this.model();
    this.save.emit({
      name: value.name,
      email: value.email,
      serviceIds: [...value.serviceIds],
    });
  }

  onEdit(employee: Employee): void {
    this.edit.emit(employee);
  }
}
