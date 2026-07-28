import { ConflictException, HttpException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Appointment } from '../appointments/schemas/appointment.schema';
import { Customer } from '../customers/schemas/customer.schema';
import { Employee } from '../employees/schemas/employee.schema';
import { Service } from '../services/schemas/service.schema';
import { BookingsService } from './bookings.service';
import { BookingResponseDto } from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

const DURATION_MINUTES = 30;
const START_ISO = '2026-07-10T09:00:00.000Z';

const serviceId = new Types.ObjectId();
const employeeId = new Types.ObjectId();
const customerId = new Types.ObjectId();
const appointmentId = new Types.ObjectId();

type QueryResult = Promise<unknown> & {
  lean: jest.Mock;
  exec: jest.Mock;
};

const queryReturning = (value: unknown): QueryResult => {
  const result = Promise.resolve(value) as QueryResult;
  result.lean = jest.fn().mockResolvedValue(value);
  result.exec = jest.fn().mockResolvedValue(value);
  return result;
};

interface ServiceModelMock {
  findById: jest.Mock;
  findOne: jest.Mock;
}

interface EmployeeModelMock {
  findById: jest.Mock;
  findOne: jest.Mock;
}

interface CustomerModelMock {
  findOne: jest.Mock;
  findOneAndUpdate: jest.Mock;
  updateOne: jest.Mock;
  create: jest.Mock;
}

interface AppointmentModelMock {
  create: jest.Mock;
  insertMany: jest.Mock;
  bulkWrite: jest.Mock;
}

const serviceDoc = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  _id: serviceId,
  name: 'Haircut',
  durationMinutes: DURATION_MINUTES,
  active: true,
  ...overrides,
});

const employeeDoc = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  _id: employeeId,
  name: 'Ada Lovelace',
  email: 'ada@acme.test',
  serviceIds: [serviceId],
  ...overrides,
});

const customerDoc = (): Record<string, unknown> => ({
  _id: customerId,
  name: 'Grace Hopper',
  email: 'grace@acme.test',
  phone: '+34600000000',
});

const appointmentDoc = (): Record<string, unknown> => ({
  _id: appointmentId,
  status: 'pending',
  startTime: new Date(START_ISO),
});

const serviceModelMock = (value: unknown = serviceDoc()): ServiceModelMock => ({
  findById: jest.fn().mockReturnValue(queryReturning(value)),
  findOne: jest.fn().mockReturnValue(queryReturning(value)),
});

const employeeModelMock = (
  value: unknown = employeeDoc(),
): EmployeeModelMock => ({
  findById: jest.fn().mockReturnValue(queryReturning(value)),
  findOne: jest.fn().mockReturnValue(queryReturning(value)),
});

const customerModelMock = (): CustomerModelMock => ({
  findOne: jest.fn().mockReturnValue(queryReturning(customerDoc())),
  findOneAndUpdate: jest.fn().mockReturnValue(queryReturning(customerDoc())),
  updateOne: jest.fn().mockResolvedValue({ upsertedId: customerId }),
  create: jest.fn().mockResolvedValue(customerDoc()),
});

const appointmentModelMock = (
  create: jest.Mock = jest.fn().mockResolvedValue(appointmentDoc()),
): AppointmentModelMock => ({
  create,
  insertMany: jest.fn(),
  bulkWrite: jest.fn(),
});

const asDto = (payload: CreateBookingDto): CreateBookingDto => payload;

const validDto = (): CreateBookingDto =>
  asDto({
    serviceId: serviceId.toString(),
    employeeId: employeeId.toString(),
    startsAt: START_ISO,
    customer: {
      name: 'Grace Hopper',
      email: 'grace@acme.test',
      phone: '+34600000000',
    },
  });

const buildService = async (models: {
  appointment: AppointmentModelMock;
  customer: CustomerModelMock;
  service: ServiceModelMock;
  employee: EmployeeModelMock;
}): Promise<BookingsService> => {
  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      BookingsService,
      {
        provide: getModelToken(Appointment.name),
        useValue: models.appointment,
      },
      { provide: getModelToken(Customer.name), useValue: models.customer },
      { provide: getModelToken(Service.name), useValue: models.service },
      { provide: getModelToken(Employee.name), useValue: models.employee },
    ],
  }).compile();

  return moduleRef.get(BookingsService);
};

describe('BookingsService', () => {
  describe('create (happy path)', () => {
    it('locks the slot creating a pending appointment whose endTime is derived from the service duration', async () => {
      const appointment = appointmentModelMock();
      const service = await buildService({
        appointment,
        customer: customerModelMock(),
        service: serviceModelMock(),
        employee: employeeModelMock(),
      });

      const result = await service.create(validDto());

      expect(appointment.create).toHaveBeenCalledTimes(1);
      const [payload] = appointment.create.mock.calls[0] as [
        Record<string, unknown>,
      ];

      expect(payload).toMatchObject({ status: 'pending' });
      expect(payload).not.toHaveProperty('tenantId');

      const startTime = new Date(payload.startTime as string).getTime();
      const endTime = new Date(payload.endTime as string).getTime();
      expect(startTime).toBe(new Date(START_ISO).getTime());
      expect(endTime - startTime).toBe(DURATION_MINUTES * 60 * 1000);

      expect(result).toBeInstanceOf(BookingResponseDto);
      expect(result).toMatchObject({ status: 'pending', startsAt: START_ISO });
      expect(result).not.toHaveProperty('_id');
      expect(result).not.toHaveProperty('tenantId');
    });

    it('upserts the customer and links its id into the created appointment', async () => {
      const appointment = appointmentModelMock();
      const customer = customerModelMock();
      const service = await buildService({
        appointment,
        customer,
        service: serviceModelMock(),
        employee: employeeModelMock(),
      });

      await service.create(validDto());

      const upsertCalls =
        customer.findOneAndUpdate.mock.calls.length +
        customer.updateOne.mock.calls.length +
        customer.create.mock.calls.length;
      expect(upsertCalls).toBeGreaterThan(0);

      const [payload] = appointment.create.mock.calls[0] as [
        Record<string, unknown>,
      ];
      expect(String(payload.customerId)).toBe(customerId.toString());
    });

    it('never uses bulkWrite or insertMany to lock the slot', async () => {
      const appointment = appointmentModelMock();
      const service = await buildService({
        appointment,
        customer: customerModelMock(),
        service: serviceModelMock(),
        employee: employeeModelMock(),
      });

      await service.create(validDto());

      expect(appointment.insertMany).not.toHaveBeenCalled();
      expect(appointment.bulkWrite).not.toHaveBeenCalled();
    });
  });

  describe('create (invariants and validation)', () => {
    it('maps a duplicate key error from the unique slot index to a ConflictException', async () => {
      const appointment = appointmentModelMock(
        jest
          .fn()
          .mockRejectedValue(Object.assign(new Error('dup'), { code: 11000 })),
      );
      const service = await buildService({
        appointment,
        customer: customerModelMock(),
        service: serviceModelMock(),
        employee: employeeModelMock(),
      });

      await expect(service.create(validDto())).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects a serviceId that does not exist in the tenant and never locks a slot', async () => {
      const appointment = appointmentModelMock();
      const service = await buildService({
        appointment,
        customer: customerModelMock(),
        service: serviceModelMock(null),
        employee: employeeModelMock(),
      });

      const error: unknown = await service
        .create(validDto())
        .catch((thrown: unknown) => thrown);

      expect(error).toBeInstanceOf(HttpException);
      expect([400, 404]).toContain((error as HttpException).getStatus());
      expect(appointment.create).not.toHaveBeenCalled();
    });

    it('rejects an employee that is not enabled for the service and never locks a slot', async () => {
      const appointment = appointmentModelMock();
      const service = await buildService({
        appointment,
        customer: customerModelMock(),
        service: serviceModelMock(),
        employee: employeeModelMock(
          employeeDoc({ serviceIds: [new Types.ObjectId()] }),
        ),
      });

      const error: unknown = await service
        .create(validDto())
        .catch((thrown: unknown) => thrown);

      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(400);
      expect(appointment.create).not.toHaveBeenCalled();
    });
  });
});
