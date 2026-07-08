import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  CatalogApi,
  CreateEmployeePayload,
  CreateServicePayload,
  Employee,
  Service,
  UpdateEmployeePayload,
  UpdateServicePayload,
} from './catalog.api';

const SERVICES_URL = '/api/v1/services';
const EMPLOYEES_URL = '/api/v1/employees';

const sampleService: Service = {
  id: 'svc-1',
  name: 'Haircut',
  price: '25.00',
  durationMinutes: 30,
  active: true,
};

const sampleServices: Service[] = [
  sampleService,
  {
    id: 'svc-2',
    name: 'Beard trim',
    price: '15.00',
    durationMinutes: 20,
    active: true,
  },
];

const sampleEmployee: Employee = {
  id: 'emp-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  serviceIds: ['svc-1', 'svc-2'],
};

const sampleEmployees: Employee[] = [sampleEmployee];

describe('CatalogApi', () => {
  let api: CatalogApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(CatalogApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('listServices performs a GET to /api/v1/services and emits the received services', () => {
    let emitted: Service[] | undefined;
    api.listServices().subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) => request.method === 'GET' && request.url === SERVICES_URL,
    );
    req.flush(sampleServices);

    expect(emitted).toEqual(sampleServices);
  });

  it('listServices emits an empty array when the backend returns no services', () => {
    let emitted: Service[] | undefined;
    api.listServices().subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) => request.method === 'GET' && request.url === SERVICES_URL,
    );
    req.flush([]);

    expect(emitted).toEqual([]);
  });

  it('createService performs a POST to /api/v1/services with the payload and emits the created service', () => {
    const payload: CreateServicePayload = {
      name: 'Haircut',
      price: '25.00',
      durationMinutes: 30,
    };

    let emitted: Service | undefined;
    api.createService(payload).subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) => request.method === 'POST' && request.url === SERVICES_URL,
    );
    expect(req.request.body).toEqual(payload);
    req.flush(sampleService);

    expect(emitted).toEqual(sampleService);
  });

  it('createService does not carry id, active or tenantId in the request body', () => {
    const payload: CreateServicePayload = {
      name: 'Haircut',
      price: '25.00',
      durationMinutes: 30,
    };

    api.createService(payload).subscribe();

    const req = httpMock.expectOne(
      (request) => request.method === 'POST' && request.url === SERVICES_URL,
    );
    const body = req.request.body as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['durationMinutes', 'name', 'price']);
    expect(body['id']).toBeUndefined();
    expect(body['active']).toBeUndefined();
    expect(body['tenantId']).toBeUndefined();
    req.flush(sampleService);
  });

  it('updateService performs a PATCH to /api/v1/services/{id} with the partial payload', () => {
    const payload: UpdateServicePayload = { price: '30.00' };

    let emitted: Service | undefined;
    api.updateService('svc-1', payload).subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) => request.method === 'PATCH' && request.url === `${SERVICES_URL}/svc-1`,
    );
    expect(req.request.body).toEqual(payload);
    const updated: Service = { ...sampleService, price: '30.00' };
    req.flush(updated);

    expect(emitted).toEqual(updated);
  });

  it('updateService does not carry the tenant in the request body', () => {
    const payload: UpdateServicePayload = { name: 'New name' };

    api.updateService('svc-1', payload).subscribe();

    const req = httpMock.expectOne(
      (request) => request.method === 'PATCH' && request.url === `${SERVICES_URL}/svc-1`,
    );
    const body = req.request.body as Record<string, unknown>;
    expect(body['tenantId']).toBeUndefined();
    req.flush(sampleService);
  });

  it('deactivateService performs a DELETE to /api/v1/services/{id} and emits the deactivated service', () => {
    let emitted: Service | undefined;
    api.deactivateService('svc-1').subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) => request.method === 'DELETE' && request.url === `${SERVICES_URL}/svc-1`,
    );
    const deactivated: Service = { ...sampleService, active: false };
    req.flush(deactivated);

    expect(emitted).toEqual(deactivated);
    expect(emitted?.active).toBe(false);
  });

  it('listEmployees performs a GET to /api/v1/employees and emits the received employees', () => {
    let emitted: Employee[] | undefined;
    api.listEmployees().subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) => request.method === 'GET' && request.url === EMPLOYEES_URL,
    );
    req.flush(sampleEmployees);

    expect(emitted).toEqual(sampleEmployees);
  });

  it('createEmployee performs a POST to /api/v1/employees with the payload including serviceIds', () => {
    const payload: CreateEmployeePayload = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      serviceIds: ['svc-1', 'svc-2'],
    };

    let emitted: Employee | undefined;
    api.createEmployee(payload).subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) => request.method === 'POST' && request.url === EMPLOYEES_URL,
    );
    expect(req.request.body).toEqual(payload);
    req.flush(sampleEmployee);

    expect(emitted).toEqual(sampleEmployee);
  });

  it('createEmployee does not carry the tenant in the request body', () => {
    const payload: CreateEmployeePayload = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      serviceIds: ['svc-1'],
    };

    api.createEmployee(payload).subscribe();

    const req = httpMock.expectOne(
      (request) => request.method === 'POST' && request.url === EMPLOYEES_URL,
    );
    const body = req.request.body as Record<string, unknown>;
    expect(body['tenantId']).toBeUndefined();
    req.flush(sampleEmployee);
  });

  it('updateEmployee performs a PATCH to /api/v1/employees/{id} reassigning serviceIds', () => {
    const payload: UpdateEmployeePayload = { serviceIds: ['svc-2'] };

    let emitted: Employee | undefined;
    api.updateEmployee('emp-1', payload).subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) => request.method === 'PATCH' && request.url === `${EMPLOYEES_URL}/emp-1`,
    );
    expect(req.request.body).toEqual(payload);
    const updated: Employee = { ...sampleEmployee, serviceIds: ['svc-2'] };
    req.flush(updated);

    expect(emitted).toEqual(updated);
  });
});
