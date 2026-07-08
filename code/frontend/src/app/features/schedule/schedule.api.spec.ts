import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ScheduleApi, WeeklyScheduleDay } from './schedule.api';

const WORKING_HOURS_URL = '/api/v1/working-hours';

const sampleDays: WeeklyScheduleDay[] = [
  {
    weekday: 'monday',
    isWorkingDay: true,
    openTime: '09:00',
    closeTime: '18:00',
    breakStart: '13:00',
    breakEnd: '14:00',
  },
  {
    weekday: 'tuesday',
    isWorkingDay: true,
    openTime: '09:00',
    closeTime: '18:00',
  },
  {
    weekday: 'sunday',
    isWorkingDay: false,
  },
];

describe('ScheduleApi', () => {
  let api: ScheduleApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ScheduleApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getSchedule performs a GET to /api/v1/working-hours and emits the received days', () => {
    let emitted: WeeklyScheduleDay[] | undefined;
    api.getSchedule().subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) => request.method === 'GET' && request.url === WORKING_HOURS_URL,
    );
    req.flush(sampleDays);

    expect(emitted).toEqual(sampleDays);
  });

  it('getSchedule emits an empty array when the backend returns no rules', () => {
    let emitted: WeeklyScheduleDay[] | undefined;
    api.getSchedule().subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) => request.method === 'GET' && request.url === WORKING_HOURS_URL,
    );
    req.flush([]);

    expect(emitted).toEqual([]);
  });

  it('saveSchedule performs a PUT to /api/v1/working-hours with a { days } body and emits the saved days', () => {
    const saved: WeeklyScheduleDay[] = [
      { weekday: 'monday', isWorkingDay: true, openTime: '10:00', closeTime: '19:00' },
    ];

    let emitted: WeeklyScheduleDay[] | undefined;
    api.saveSchedule(sampleDays).subscribe((value) => (emitted = value));

    const req = httpMock.expectOne(
      (request) => request.method === 'PUT' && request.url === WORKING_HOURS_URL,
    );
    expect(req.request.body).toEqual({ days: sampleDays });
    req.flush(saved);

    expect(emitted).toEqual(saved);
  });

  it('saveSchedule does not carry the tenant in the request body', () => {
    api.saveSchedule(sampleDays).subscribe();

    const req = httpMock.expectOne(
      (request) => request.method === 'PUT' && request.url === WORKING_HOURS_URL,
    );
    const body = req.request.body as Record<string, unknown>;
    expect(Object.keys(body)).toEqual(['days']);
    expect(body['tenantId']).toBeUndefined();
    req.flush(sampleDays);
  });
});
