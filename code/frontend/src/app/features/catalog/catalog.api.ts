import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type Service = {
  id: string;
  name: string;
  price: string;
  durationMinutes: number;
  active: boolean;
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  serviceIds: string[];
};

export type CreateServicePayload = {
  name: string;
  price: string;
  durationMinutes: number;
};

export type UpdateServicePayload = Partial<CreateServicePayload>;

export type CreateEmployeePayload = {
  name: string;
  email: string;
  serviceIds?: string[];
};

export type UpdateEmployeePayload = Partial<CreateEmployeePayload>;

@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly http = inject(HttpClient);
  private readonly servicesUrl = '/api/v1/services';
  private readonly employeesUrl = '/api/v1/employees';

  listServices(): Observable<Service[]> {
    return this.http.get<Service[]>(this.servicesUrl);
  }

  createService(payload: CreateServicePayload): Observable<Service> {
    return this.http.post<Service>(this.servicesUrl, payload);
  }

  updateService(id: string, payload: UpdateServicePayload): Observable<Service> {
    return this.http.patch<Service>(`${this.servicesUrl}/${id}`, payload);
  }

  deactivateService(id: string): Observable<Service> {
    return this.http.delete<Service>(`${this.servicesUrl}/${id}`);
  }

  listEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.employeesUrl);
  }

  createEmployee(payload: CreateEmployeePayload): Observable<Employee> {
    return this.http.post<Employee>(this.employeesUrl, payload);
  }

  updateEmployee(id: string, payload: UpdateEmployeePayload): Observable<Employee> {
    return this.http.patch<Employee>(`${this.employeesUrl}/${id}`, payload);
  }
}
