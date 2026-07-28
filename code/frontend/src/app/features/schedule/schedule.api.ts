import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type WeeklyScheduleDay = {
  weekday: string;
  isWorkingDay: boolean;
  openTime?: string;
  closeTime?: string;
  breakStart?: string;
  breakEnd?: string;
};

export type WeeklySchedule = WeeklyScheduleDay[];

@Injectable({ providedIn: 'root' })
export class ScheduleApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/working-hours';

  getSchedule(): Observable<WeeklyScheduleDay[]> {
    return this.http.get<WeeklyScheduleDay[]>(this.baseUrl);
  }

  saveSchedule(days: WeeklyScheduleDay[]): Observable<WeeklyScheduleDay[]> {
    return this.http.put<WeeklyScheduleDay[]>(this.baseUrl, { days });
  }
}
