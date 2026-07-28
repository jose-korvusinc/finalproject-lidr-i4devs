import { HttpErrorResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, Subject, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { CatalogPanel } from './catalog-panel';
import {
  CatalogApi,
  CreateEmployeePayload,
  CreateServicePayload,
  Employee,
  Service,
  UpdateEmployeePayload,
  UpdateServicePayload,
} from './catalog.api';
import { EmployeeForm } from './employee-form';
import { ServiceForm } from './service-form';

function service(overrides: Partial<Service> = {}): Service {
  return {
    id: 's1',
    name: 'Corte de pelo',
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
    serviceIds: ['s1'],
    ...overrides,
  };
}

const SERVICES: Service[] = [
  service({ id: 's1', name: 'Corte de pelo' }),
  service({ id: 's2', name: 'Coloracion', price: '40.00', durationMinutes: 60 }),
];

const EMPLOYEES: Employee[] = [employee({ id: 'e1' })];

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
  createService: Mock<(payload: CreateServicePayload) => Observable<Service>>;
  updateService: Mock<(id: string, payload: UpdateServicePayload) => Observable<Service>>;
  deactivateService: Mock<(id: string) => Observable<Service>>;
  listEmployees: Mock<() => Observable<Employee[]>>;
  createEmployee: Mock<(payload: CreateEmployeePayload) => Observable<Employee>>;
  updateEmployee: Mock<(id: string, payload: UpdateEmployeePayload) => Observable<Employee>>;
}

describe('CatalogPanel', () => {
  async function setup(overrides?: Partial<CatalogApiDouble>) {
    const apiDouble: CatalogApiDouble = {
      listServices: vi.fn<() => Observable<Service[]>>(() => of(SERVICES)),
      createService: vi.fn<(payload: CreateServicePayload) => Observable<Service>>((payload) =>
        of(service({ id: 's-new', ...payload })),
      ),
      updateService: vi.fn<(id: string, payload: UpdateServicePayload) => Observable<Service>>(
        (id, payload) => of(service({ id, ...payload })),
      ),
      deactivateService: vi.fn<(id: string) => Observable<Service>>((id) =>
        of(service({ id, active: false })),
      ),
      listEmployees: vi.fn<() => Observable<Employee[]>>(() => of(EMPLOYEES)),
      createEmployee: vi.fn<(payload: CreateEmployeePayload) => Observable<Employee>>((payload) =>
        of(employee({ id: 'e-new', ...payload })),
      ),
      updateEmployee: vi.fn<(id: string, payload: UpdateEmployeePayload) => Observable<Employee>>(
        (id, payload) => of(employee({ id, ...payload })),
      ),
      ...overrides,
    };

    await TestBed.configureTestingModule({
      imports: [CatalogPanel, ServiceForm, EmployeeForm],
      providers: [{ provide: CatalogApi, useValue: apiDouble }],
    }).compileComponents();

    const fixture = TestBed.createComponent(CatalogPanel);
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

  function serviceFormEl(
    fixture: Awaited<ReturnType<typeof setup>>['fixture'],
  ): DebugElement | null {
    return fixture.debugElement.query(By.directive(ServiceForm));
  }

  function employeeFormEl(
    fixture: Awaited<ReturnType<typeof setup>>['fixture'],
  ): DebugElement | null {
    return fixture.debugElement.query(By.directive(EmployeeForm));
  }

  function confirmation(root: HTMLElement): HTMLElement | undefined {
    return [...statusRegions(root), ...alertRegions(root)].find(
      (element) => (element.textContent?.trim().length ?? 0) > 0,
    );
  }

  it('loads services and employees once on init and renders both forms with the loaded data', async () => {
    const { fixture, apiDouble } = await setup();
    await settle(fixture);

    expect(apiDouble.listServices).toHaveBeenCalledTimes(1);
    expect(apiDouble.listEmployees).toHaveBeenCalledTimes(1);

    const serviceForm = serviceFormEl(fixture);
    const employeeForm = employeeFormEl(fixture);
    expect(serviceForm).toBeTruthy();
    expect(employeeForm).toBeTruthy();

    const serviceChild = serviceForm!.componentInstance as ServiceForm;
    const employeeChild = employeeForm!.componentInstance as EmployeeForm;
    expect(serviceChild.services()).toEqual(SERVICES);
    expect(employeeChild.employees()).toEqual(EMPLOYEES);
    expect(employeeChild.availableServices()).toEqual(SERVICES);
  });

  it('shows an accessible loading indicator while the initial load is pending', async () => {
    const servicesGate = new Subject<Service[]>();
    const employeesGate = new Subject<Employee[]>();
    const { fixture, root } = await setup({
      listServices: vi.fn<() => Observable<Service[]>>(() => servicesGate.asObservable()),
      listEmployees: vi.fn<() => Observable<Employee[]>>(() => employeesGate.asObservable()),
    });

    expect(busyElements(root).length + statusRegions(root).length).toBeGreaterThan(0);

    servicesGate.next(SERVICES);
    servicesGate.complete();
    employeesGate.next(EMPLOYEES);
    employeesGate.complete();
    await settle(fixture);
  });

  it('renders both forms for an empty catalog without showing an error', async () => {
    const { fixture, root } = await setup({
      listServices: vi.fn<() => Observable<Service[]>>(() => of([])),
      listEmployees: vi.fn<() => Observable<Employee[]>>(() => of([])),
    });
    await settle(fixture);

    expect(serviceFormEl(fixture)).toBeTruthy();
    expect(employeeFormEl(fixture)).toBeTruthy();
    expect(alertRegions(root)).toHaveLength(0);
  });

  it('shows an accessible error without raw backend detail when loading fails', async () => {
    const { fixture, root } = await setup({
      listServices: vi.fn<() => Observable<Service[]>>(() =>
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

  it('creates the service, confirms accessibly and refreshes the list on save', async () => {
    const { fixture, root, apiDouble } = await setup();
    await settle(fixture);

    const form = serviceFormEl(fixture);
    expect(form).toBeTruthy();

    const payload: CreateServicePayload = {
      name: 'Afeitado',
      price: '15.00',
      durationMinutes: 20,
    };
    (form!.componentInstance as ServiceForm).save.emit(payload);
    await settle(fixture);

    expect(apiDouble.createService).toHaveBeenCalledTimes(1);
    expect(apiDouble.createService).toHaveBeenCalledWith(payload);

    expect(apiDouble.listServices).toHaveBeenCalledTimes(2);

    expect(confirmation(root)).toBeTruthy();
  });

  it('deactivates the service by id, confirms accessibly and refreshes the list', async () => {
    const { fixture, root, apiDouble } = await setup();
    await settle(fixture);

    const form = serviceFormEl(fixture);
    expect(form).toBeTruthy();

    const target = SERVICES[1];
    (form!.componentInstance as ServiceForm).deactivate.emit(target);
    await settle(fixture);

    expect(apiDouble.deactivateService).toHaveBeenCalledTimes(1);
    expect(apiDouble.deactivateService).toHaveBeenCalledWith(target.id);

    expect(apiDouble.listServices).toHaveBeenCalledTimes(2);

    expect(confirmation(root)).toBeTruthy();
  });

  it('creates the employee and confirms accessibly on save', async () => {
    const { fixture, root, apiDouble } = await setup();
    await settle(fixture);

    const form = employeeFormEl(fixture);
    expect(form).toBeTruthy();

    const payload: CreateEmployeePayload = {
      name: 'Grace Hopper',
      email: 'grace@example.com',
      serviceIds: ['s1'],
    };
    (form!.componentInstance as EmployeeForm).save.emit(payload);
    await settle(fixture);

    expect(apiDouble.createEmployee).toHaveBeenCalledTimes(1);
    expect(apiDouble.createEmployee).toHaveBeenCalledWith(payload);

    expect(confirmation(root)).toBeTruthy();
  });

  it('reflects an accessible saving state while a create is in flight', async () => {
    const gate = new Subject<Service>();
    const { fixture, root } = await setup({
      createService: vi.fn<(payload: CreateServicePayload) => Observable<Service>>(() =>
        gate.asObservable(),
      ),
    });
    await settle(fixture);

    const form = serviceFormEl(fixture);
    expect(form).toBeTruthy();

    (form!.componentInstance as ServiceForm).save.emit({
      name: 'Afeitado',
      price: '15.00',
      durationMinutes: 20,
    });
    await settle(fixture);

    expect(busyElements(root).length).toBeGreaterThan(0);

    gate.next(service({ id: 's-new' }));
    gate.complete();
    await settle(fixture);
  });

  it('shows an accessible error without raw detail on save failure and keeps the form available', async () => {
    const { fixture, root } = await setup({
      createService: vi.fn<(payload: CreateServicePayload) => Observable<Service>>(() =>
        throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' })),
      ),
    });
    await settle(fixture);

    const form = serviceFormEl(fixture);
    expect(form).toBeTruthy();

    (form!.componentInstance as ServiceForm).save.emit({
      name: 'Afeitado',
      price: '15.00',
      durationMinutes: 20,
    });
    await settle(fixture);

    const alerts = alertRegions(root);
    expect(alerts.length).toBeGreaterThan(0);
    const message = alerts.map((element) => element.textContent ?? '').join(' ');
    expect(message).not.toMatch(/HttpErrorResponse/);
    expect(message).not.toMatch(/500/);

    expect(serviceFormEl(fixture)).toBeTruthy();
  });
});
