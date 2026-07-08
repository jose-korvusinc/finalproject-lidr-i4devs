import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import {
  CatalogApi,
  CreateEmployeePayload,
  CreateServicePayload,
  Employee,
  Service,
} from './catalog.api';
import { EmployeeForm } from './employee-form';
import { ServiceForm } from './service-form';

type LoadState = 'loading' | 'ready' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

@Component({
  selector: 'app-catalog-panel',
  imports: [ServiceForm, EmployeeForm],
  templateUrl: './catalog-panel.html',
  styleUrl: './catalog-panel.scss',
})
export class CatalogPanel {
  private readonly api = inject(CatalogApi);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loadState = signal<LoadState>('loading');
  protected readonly saveState = signal<SaveState>('idle');
  protected readonly services = signal<Service[]>([]);
  protected readonly employees = signal<Employee[]>([]);
  protected readonly editingService = signal<Service | null>(null);
  protected readonly editingEmployee = signal<Employee | null>(null);

  constructor() {
    forkJoin({
      services: this.api.listServices(),
      employees: this.api.listEmployees(),
    })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: ({ services, employees }) => {
          this.services.set(services);
          this.employees.set(employees);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  onSaveService(payload: CreateServicePayload): void {
    this.saveState.set('saving');
    this.api
      .createService(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saveState.set('saved');
          this.refreshServices();
        },
        error: () => this.saveState.set('error'),
      });
  }

  onDeactivateService(service: Service): void {
    this.saveState.set('saving');
    this.api
      .deactivateService(service.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saveState.set('saved');
          this.refreshServices();
        },
        error: () => this.saveState.set('error'),
      });
  }

  onEditService(service: Service): void {
    this.editingService.set(service);
  }

  onSaveEmployee(payload: CreateEmployeePayload): void {
    this.saveState.set('saving');
    this.api
      .createEmployee(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saveState.set('saved');
          this.refreshEmployees();
        },
        error: () => this.saveState.set('error'),
      });
  }

  onEditEmployee(employee: Employee): void {
    this.editingEmployee.set(employee);
  }

  private refreshServices(): void {
    this.api
      .listServices()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (services) => this.services.set(services) });
  }

  private refreshEmployees(): void {
    this.api
      .listEmployees()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (employees) => this.employees.set(employees) });
  }
}
