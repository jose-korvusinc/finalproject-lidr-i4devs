import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  AvailabilityQuery,
  AvailabilitySlot,
  BookingApi,
  BookingRequest,
  BookingResult,
} from './booking.api';

const AVAILABILITY_URL = '/api/v1/availability';
const BOOKINGS_URL = '/api/v1/bookings';

const sampleQuery: AvailabilityQuery = {
  serviceId: 'service-1',
  employeeId: 'employee-1',
  date: '2026-07-10',
};

const sampleSlots: AvailabilitySlot[] = [
  { startsAt: '2026-07-10T09:00:00Z', endsAt: '2026-07-10T09:30:00Z' },
  { startsAt: '2026-07-10T09:30:00Z', endsAt: '2026-07-10T10:00:00Z' },
];

const sampleRequest: BookingRequest = {
  serviceId: 'service-1',
  employeeId: 'employee-1',
  startsAt: '2026-07-10T09:00:00Z',
  customer: {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+34600000000',
  },
};

const sampleResult: BookingResult = {
  id: 'booking-1',
  status: 'confirmed',
  startsAt: '2026-07-10T09:00:00Z',
};

describe('BookingApi', () => {
  let api: BookingApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(BookingApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getAvailability performs a GET to /api/v1/availability with the query as params', () => {
    let emitted: AvailabilitySlot[] | undefined;
    api.getAvailability(sampleQuery).subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) => request.method === 'GET' && request.url === AVAILABILITY_URL,
    );
    expect(req.request.params.get('serviceId')).toBe(sampleQuery.serviceId);
    expect(req.request.params.get('employeeId')).toBe(sampleQuery.employeeId);
    expect(req.request.params.get('date')).toBe(sampleQuery.date);
    req.flush(sampleSlots);

    expect(emitted).toEqual(sampleSlots);
  });

  it('getAvailability emits an empty array when there are no slots', () => {
    let emitted: AvailabilitySlot[] | undefined;
    api.getAvailability(sampleQuery).subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) => request.method === 'GET' && request.url === AVAILABILITY_URL,
    );
    req.flush([]);

    expect(emitted).toEqual([]);
  });

  it('createBooking performs a POST to /api/v1/bookings with the request as body', () => {
    let emitted: BookingResult | undefined;
    api.createBooking(sampleRequest).subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) => request.method === 'POST' && request.url === BOOKINGS_URL,
    );
    expect(req.request.body).toEqual(sampleRequest);
    req.flush(sampleResult);

    expect(emitted).toEqual(sampleResult);
  });

  it('createBooking sends the customer in the body and never carries the tenant', () => {
    api.createBooking(sampleRequest).subscribe();

    const req = httpMock.expectOne(
      (request) => request.method === 'POST' && request.url === BOOKINGS_URL,
    );
    const body = req.request.body as Record<string, unknown>;
    expect(body['customer']).toEqual(sampleRequest.customer);
    expect(body['tenantId']).toBeUndefined();
    req.flush(sampleResult);
  });
});
