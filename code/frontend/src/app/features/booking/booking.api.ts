import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type AvailabilitySlot = {
  startsAt: string;
  endsAt: string;
};

export type AvailabilityQuery = {
  serviceId: string;
  employeeId: string;
  date: string;
};

export type BookingCustomer = {
  name: string;
  email: string;
  phone: string;
};

export type BookingRequest = {
  serviceId: string;
  employeeId: string;
  startsAt: string;
  customer: BookingCustomer;
};

export type BookingResult = {
  id: string;
  status: string;
  startsAt: string;
};

@Injectable({ providedIn: 'root' })
export class BookingApi {
  private readonly http = inject(HttpClient);
  private readonly availabilityUrl = '/api/v1/availability';
  private readonly bookingsUrl = '/api/v1/bookings';

  getAvailability(query: AvailabilityQuery): Observable<AvailabilitySlot[]> {
    return this.http.get<AvailabilitySlot[]>(this.availabilityUrl, {
      params: {
        serviceId: query.serviceId,
        employeeId: query.employeeId,
        date: query.date,
      },
    });
  }

  createBooking(request: BookingRequest): Observable<BookingResult> {
    return this.http.post<BookingResult>(this.bookingsUrl, request);
  }
}
