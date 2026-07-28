import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import {
  Appointment,
  BookingStatus,
} from '../appointments/schemas/appointment.schema';
import { Employee } from '../employees/schemas/employee.schema';
import { Service } from '../services/schemas/service.schema';
import { WorkingHours } from '../tenants/schemas/working-hours.schema';
import { AvailabilityService } from './availability.service';
import { TimeSlot } from './time-slot';

const FRIDAY = '2026-07-10';

const SERVICE_ID = new Types.ObjectId('665f1b2c9c1e4a0012ab0001');
const EMPLOYEE_ID = new Types.ObjectId('665f1b2c9c1e4a0012ab0002');
const TENANT_ID = new Types.ObjectId('665f1b2c9c1e4a0012ab0003');

interface LeanService {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  durationMinutes: number;
  active: boolean;
}

interface LeanEmployee {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  email: string;
  serviceIds: Types.ObjectId[];
}

interface LeanWorkingHours {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  weekday: string;
  isWorkingDay: boolean;
  openTime?: string;
  closeTime?: string;
  breakStart?: string;
  breakEnd?: string;
}

interface LeanAppointment {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  employeeId: Types.ObjectId;
  serviceId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: string;
}

interface Mocks {
  serviceModel: { findById: jest.Mock; findOne: jest.Mock };
  employeeModel: { findById: jest.Mock; findOne: jest.Mock };
  workingHoursModel: { findOne: jest.Mock; find: jest.Mock };
  appointmentModel: { find: jest.Mock };
}

interface Scenario {
  service?: LeanService | null;
  employee?: LeanEmployee | null;
  workingHours?: LeanWorkingHours | null;
  appointments?: LeanAppointment[];
}

const leanReturning = (value: unknown): { lean: jest.Mock } => ({
  lean: jest.fn().mockResolvedValue(value),
});

const at = (hhmm: string): Date => new Date(`${FRIDAY}T${hhmm}:00.000Z`);

const slot = (start: string, end: string): TimeSlot => ({
  startsAt: at(start),
  endsAt: at(end),
});

const appointment = (
  start: string,
  end: string,
  status: string = BookingStatus.CONFIRMED,
): LeanAppointment => ({
  _id: new Types.ObjectId(),
  tenantId: TENANT_ID,
  employeeId: EMPLOYEE_ID,
  serviceId: SERVICE_ID,
  startTime: at(start),
  endTime: at(end),
  status,
});

const defaultService: LeanService = {
  _id: SERVICE_ID,
  tenantId: TENANT_ID,
  name: 'Haircut',
  durationMinutes: 30,
  active: true,
};

const defaultEmployee: LeanEmployee = {
  _id: EMPLOYEE_ID,
  tenantId: TENANT_ID,
  name: 'Ada Lovelace',
  email: 'ada@acme.test',
  serviceIds: [SERVICE_ID],
};

const fridayWorkingHours: LeanWorkingHours = {
  _id: new Types.ObjectId('665f1b2c9c1e4a0012ab0004'),
  tenantId: TENANT_ID,
  weekday: 'fri',
  isWorkingDay: true,
  openTime: '09:00',
  closeTime: '18:00',
  breakStart: '14:00',
  breakEnd: '15:00',
};

const buildService = async (
  scenario: Scenario = {},
): Promise<{ availability: AvailabilityService; mocks: Mocks }> => {
  const service =
    scenario.service === undefined ? defaultService : scenario.service;
  const employee =
    scenario.employee === undefined ? defaultEmployee : scenario.employee;
  const workingHours =
    scenario.workingHours === undefined
      ? fridayWorkingHours
      : scenario.workingHours;
  const appointments = scenario.appointments ?? [];

  const mocks: Mocks = {
    serviceModel: {
      findById: jest.fn().mockReturnValue(leanReturning(service)),
      findOne: jest.fn().mockReturnValue(leanReturning(service)),
    },
    employeeModel: {
      findById: jest.fn().mockReturnValue(leanReturning(employee)),
      findOne: jest.fn().mockReturnValue(leanReturning(employee)),
    },
    workingHoursModel: {
      findOne: jest.fn().mockReturnValue(leanReturning(workingHours)),
      find: jest
        .fn()
        .mockReturnValue(leanReturning(workingHours ? [workingHours] : [])),
    },
    appointmentModel: {
      find: jest.fn().mockReturnValue(leanReturning(appointments)),
    },
  };

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      AvailabilityService,
      {
        provide: getModelToken(WorkingHours.name),
        useValue: mocks.workingHoursModel,
      },
      { provide: getModelToken(Service.name), useValue: mocks.serviceModel },
      { provide: getModelToken(Employee.name), useValue: mocks.employeeModel },
      {
        provide: getModelToken(Appointment.name),
        useValue: mocks.appointmentModel,
      },
    ],
  }).compile();

  return { availability: moduleRef.get(AvailabilityService), mocks };
};

const query = {
  serviceId: SERVICE_ID.toString(),
  employeeId: EMPLOYEE_ID.toString(),
  date: FRIDAY,
};

describe('AvailabilityService.computeSlots', () => {
  it('computes consecutive 30-min slots across the working day excluding the break and booked appointments', async () => {
    const { availability } = await buildService({
      appointments: [appointment('10:00', '10:30', BookingStatus.CONFIRMED)],
    });

    const result = await availability.computeSlots(query);

    const expected: TimeSlot[] = [
      slot('09:00', '09:30'),
      slot('09:30', '10:00'),
      slot('10:30', '11:00'),
      slot('11:00', '11:30'),
      slot('11:30', '12:00'),
      slot('12:00', '12:30'),
      slot('12:30', '13:00'),
      slot('13:00', '13:30'),
      slot('13:30', '14:00'),
      slot('15:00', '15:30'),
      slot('15:30', '16:00'),
      slot('16:00', '16:30'),
      slot('16:30', '17:00'),
      slot('17:00', '17:30'),
      slot('17:30', '18:00'),
    ];

    expect(result).toEqual(expected);
    expect(result).toHaveLength(15);
  });

  it('offers the boundary slots at the start and just before close', async () => {
    const { availability } = await buildService();

    const result = await availability.computeSlots(query);

    expect(result).toContainEqual(slot('09:00', '09:30'));
    expect(result).toContainEqual(slot('17:30', '18:00'));
  });

  it('excludes the slots that fall inside the break window', async () => {
    const { availability } = await buildService();

    const result = await availability.computeSlots(query);

    expect(result).not.toContainEqual(slot('14:00', '14:30'));
    expect(result).not.toContainEqual(slot('14:30', '15:00'));
    expect(result).toContainEqual(slot('13:30', '14:00'));
    expect(result).toContainEqual(slot('15:00', '15:30'));
  });

  it('excludes the slot occupied by a confirmed appointment', async () => {
    const { availability } = await buildService({
      appointments: [appointment('10:00', '10:30', BookingStatus.CONFIRMED)],
    });

    const result = await availability.computeSlots(query);

    expect(result).not.toContainEqual(slot('10:00', '10:30'));
    expect(result).toContainEqual(slot('09:30', '10:00'));
    expect(result).toContainEqual(slot('10:30', '11:00'));
  });

  it('blocks a slot overlapping a pending appointment', async () => {
    const { availability } = await buildService({
      workingHours: {
        ...fridayWorkingHours,
        closeTime: '10:00',
        breakStart: undefined,
        breakEnd: undefined,
      },
      appointments: [appointment('09:00', '09:30', BookingStatus.PENDING)],
    });

    const result = await availability.computeSlots(query);

    expect(result).toEqual([slot('09:30', '10:00')]);
  });

  it('returns the slots ordered by startsAt', async () => {
    const { availability } = await buildService();

    const result = await availability.computeSlots(query);

    const startTimes = result.map((entry) => entry.startsAt.getTime());
    const sorted = [...startTimes].sort((a, b) => a - b);
    expect(startTimes).toEqual(sorted);
  });

  it('is deterministic and does not depend on the current wall clock', async () => {
    const { availability } = await buildService({
      appointments: [appointment('10:00', '10:30', BookingStatus.CONFIRMED)],
    });

    const first = await availability.computeSlots(query);
    const second = await availability.computeSlots(query);

    expect(first).toEqual(second);
    expect(first).toHaveLength(15);
  });

  describe('guards that yield no slots', () => {
    it('returns an empty schedule when the employee is not enabled for the service', async () => {
      const { availability, mocks } = await buildService({
        employee: { ...defaultEmployee, serviceIds: [] },
      });

      const result = await availability.computeSlots(query);

      expect(result).toEqual([]);
      expect(mocks.appointmentModel.find).not.toHaveBeenCalled();
      expect(mocks.workingHoursModel.findOne).not.toHaveBeenCalled();
      expect(mocks.workingHoursModel.find).not.toHaveBeenCalled();
    });

    it('returns an empty schedule when the service does not exist', async () => {
      const { availability, mocks } = await buildService({ service: null });

      const result = await availability.computeSlots(query);

      expect(result).toEqual([]);
      expect(mocks.employeeModel.findById).not.toHaveBeenCalled();
      expect(mocks.employeeModel.findOne).not.toHaveBeenCalled();
    });

    it('returns an empty schedule on a non-working day', async () => {
      const { availability } = await buildService({
        workingHours: {
          ...fridayWorkingHours,
          isWorkingDay: false,
        },
      });

      const result = await availability.computeSlots(query);

      expect(result).toEqual([]);
    });

    it('returns an empty schedule when there is no working-hours rule for that weekday', async () => {
      const { availability } = await buildService({ workingHours: null });

      const result = await availability.computeSlots(query);

      expect(result).toEqual([]);
    });

    it('returns an empty schedule when the whole day is already booked', async () => {
      const { availability } = await buildService({
        workingHours: {
          ...fridayWorkingHours,
          closeTime: '10:00',
          breakStart: undefined,
          breakEnd: undefined,
        },
        appointments: [
          appointment('09:00', '09:30', BookingStatus.CONFIRMED),
          appointment('09:30', '10:00', BookingStatus.CONFIRMED),
        ],
      });

      const result = await availability.computeSlots(query);

      expect(result).toEqual([]);
    });
  });
});
