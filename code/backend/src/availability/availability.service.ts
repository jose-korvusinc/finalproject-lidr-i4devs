import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Appointment,
  BookingStatus,
} from '../appointments/schemas/appointment.schema';
import { Employee } from '../employees/schemas/employee.schema';
import { Service } from '../services/schemas/service.schema';
import { WorkingHours } from '../tenants/schemas/working-hours.schema';
import { TimeSlot } from './time-slot';

export interface ComputeSlotsQuery {
  serviceId: string;
  employeeId: string;
  date: string;
}

interface LeanService {
  durationMinutes: number;
}

interface LeanEmployee {
  serviceIds: { toString(): string }[];
}

interface LeanWorkingHours {
  isWorkingDay: boolean;
  openTime?: string;
  closeTime?: string;
  breakStart?: string;
  breakEnd?: string;
}

interface LeanAppointment {
  startTime: Date;
  endTime: Date;
  status: string;
}

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

const BLOCKING_STATUSES: readonly string[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
];

const parseHhmmToMinutes = (hhmm: string): number => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
};

const atMinutes = (date: string, minutes: number): Date =>
  new Date(new Date(`${date}T00:00:00.000Z`).getTime() + minutes * 60_000);

const overlaps = (
  startMs: number,
  endMs: number,
  otherStartMs: number,
  otherEndMs: number,
): boolean => startMs < otherEndMs && endMs > otherStartMs;

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(WorkingHours.name)
    private readonly workingHoursModel: Model<WorkingHours>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<Service>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<Employee>,
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,
  ) {}

  async computeSlots(query: ComputeSlotsQuery): Promise<TimeSlot[]> {
    const service = await this.serviceModel
      .findById(query.serviceId, { durationMinutes: 1 })
      .lean<LeanService | null>();
    if (!service) {
      return [];
    }

    const employee = await this.employeeModel
      .findById(query.employeeId, { serviceIds: 1 })
      .lean<LeanEmployee | null>();
    if (
      !employee ||
      !employee.serviceIds.some((id) => id.toString() === query.serviceId)
    ) {
      return [];
    }

    const weekday =
      WEEKDAYS[new Date(`${query.date}T00:00:00.000Z`).getUTCDay()];
    const workingHours = await this.workingHoursModel
      .findOne(
        { weekday },
        {
          isWorkingDay: 1,
          openTime: 1,
          closeTime: 1,
          breakStart: 1,
          breakEnd: 1,
        },
      )
      .lean<LeanWorkingHours | null>();
    if (
      !workingHours ||
      !workingHours.isWorkingDay ||
      !workingHours.openTime ||
      !workingHours.closeTime
    ) {
      return [];
    }

    const dayStart = atMinutes(query.date, 0);
    const dayEnd = atMinutes(query.date, 24 * 60);
    const appointments = await this.appointmentModel
      .find(
        {
          employeeId: query.employeeId,
          status: { $in: BLOCKING_STATUSES },
          startTime: { $lt: dayEnd },
          endTime: { $gt: dayStart },
        },
        { startTime: 1, endTime: 1, status: 1 },
      )
      .lean<LeanAppointment[]>();

    return this.buildSlots(
      query.date,
      service.durationMinutes,
      workingHours,
      appointments,
    );
  }

  private buildSlots(
    date: string,
    durationMinutes: number,
    workingHours: LeanWorkingHours,
    appointments: LeanAppointment[],
  ): TimeSlot[] {
    const openMinutes = parseHhmmToMinutes(workingHours.openTime as string);
    const closeMinutes = parseHhmmToMinutes(workingHours.closeTime as string);
    const hasBreak = Boolean(workingHours.breakStart && workingHours.breakEnd);
    const breakStartMs = hasBreak
      ? atMinutes(
          date,
          parseHhmmToMinutes(workingHours.breakStart as string),
        ).getTime()
      : 0;
    const breakEndMs = hasBreak
      ? atMinutes(
          date,
          parseHhmmToMinutes(workingHours.breakEnd as string),
        ).getTime()
      : 0;
    const bookings = appointments
      .filter((appointment) => BLOCKING_STATUSES.includes(appointment.status))
      .map((appointment) => ({
        startMs: appointment.startTime.getTime(),
        endMs: appointment.endTime.getTime(),
      }));

    const slots: TimeSlot[] = [];
    for (
      let start = openMinutes;
      start + durationMinutes <= closeMinutes;
      start += durationMinutes
    ) {
      const startsAt = atMinutes(date, start);
      const endsAt = atMinutes(date, start + durationMinutes);
      const startMs = startsAt.getTime();
      const endMs = endsAt.getTime();

      if (hasBreak && overlaps(startMs, endMs, breakStartMs, breakEndMs)) {
        continue;
      }
      if (
        bookings.some((booking) =>
          overlaps(startMs, endMs, booking.startMs, booking.endMs),
        )
      ) {
        continue;
      }
      slots.push({ startsAt, endsAt });
    }

    return slots;
  }
}
