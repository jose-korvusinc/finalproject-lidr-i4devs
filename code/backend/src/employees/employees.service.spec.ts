import {
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Service } from '../services/schemas/service.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';
import { Employee } from './schemas/employee.schema';

interface LeanEmployee {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  email: string;
  serviceIds: Types.ObjectId[];
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

interface EmployeeModelMock {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findOne: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findOneAndUpdate: jest.Mock;
  updateOne: jest.Mock;
}

interface ServiceModelMock {
  find: jest.Mock;
  countDocuments: jest.Mock;
  distinct: jest.Mock;
}

const leanReturning = (value: unknown): { lean: jest.Mock } => ({
  lean: jest.fn().mockResolvedValue(value),
});

const leanEmployee = (overrides: Partial<LeanEmployee> = {}): LeanEmployee => ({
  _id: new Types.ObjectId('665f1b2c9c1e4a0012ab34cd'),
  tenantId: new Types.ObjectId('665f1b2c9c1e4a0012abffff'),
  name: 'Ada Lovelace',
  email: 'ada@acme.test',
  serviceIds: [],
  schemaVersion: 1,
  createdAt: '2026-07-07T09:00:00.000Z',
  updatedAt: '2026-07-07T09:00:00.000Z',
  ...overrides,
});

const employeeModelMock = (
  overrides: Partial<EmployeeModelMock> = {},
): EmployeeModelMock => ({
  create: jest.fn().mockResolvedValue(leanEmployee()),
  find: jest.fn().mockReturnValue(leanReturning([leanEmployee()])),
  findById: jest.fn().mockReturnValue(leanReturning(leanEmployee())),
  findOne: jest.fn().mockReturnValue(leanReturning(leanEmployee())),
  findByIdAndUpdate: jest.fn().mockReturnValue(leanReturning(leanEmployee())),
  findOneAndUpdate: jest.fn().mockReturnValue(leanReturning(leanEmployee())),
  updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }),
  ...overrides,
});

const serviceModelReturning = (
  existingIds: Types.ObjectId[],
): ServiceModelMock => ({
  find: jest
    .fn()
    .mockReturnValue(leanReturning(existingIds.map((_id) => ({ _id })))),
  countDocuments: jest.fn().mockResolvedValue(existingIds.length),
  distinct: jest.fn().mockResolvedValue(existingIds),
});

const asCreateDto = (payload: CreateEmployeeDto): CreateEmployeeDto => payload;

const asUpdateDto = (payload: UpdateEmployeeDto): UpdateEmployeeDto => payload;

const buildService = async (
  employeeModel: EmployeeModelMock,
  serviceModel: ServiceModelMock,
): Promise<EmployeesService> => {
  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      EmployeesService,
      { provide: getModelToken(Employee.name), useValue: employeeModel },
      { provide: getModelToken(Service.name), useValue: serviceModel },
    ],
  }).compile();

  return moduleRef.get(EmployeesService);
};

describe('EmployeesService', () => {
  describe('create', () => {
    it('creates the employee with valid serviceIds and returns a public dto without internal fields', async () => {
      const serviceId = new Types.ObjectId();
      const employeeModel = employeeModelMock({
        create: jest
          .fn()
          .mockResolvedValue(leanEmployee({ serviceIds: [serviceId] })),
      });
      const service = await buildService(
        employeeModel,
        serviceModelReturning([serviceId]),
      );

      const result = await service.create(
        asCreateDto({
          name: 'Ada Lovelace',
          email: 'ada@acme.test',
          serviceIds: [serviceId.toString()],
        }),
      );

      expect(employeeModel.create).toHaveBeenCalledTimes(1);
      const [payload] = employeeModel.create.mock.calls[0] as [
        Record<string, unknown>,
      ];
      expect(payload).not.toHaveProperty('tenantId');
      expect(result).toBeInstanceOf(EmployeeResponseDto);
      expect(result).toMatchObject({
        name: 'Ada Lovelace',
        email: 'ada@acme.test',
      });
      expect(result).not.toHaveProperty('_id');
      expect(result).not.toHaveProperty('tenantId');
    });

    it('rejects a serviceId that does not exist in the tenant and never creates the employee', async () => {
      const missingId = new Types.ObjectId();
      const employeeModel = employeeModelMock();
      const service = await buildService(
        employeeModel,
        serviceModelReturning([]),
      );

      const error: unknown = await service
        .create(
          asCreateDto({
            name: 'Ada Lovelace',
            email: 'ada@acme.test',
            serviceIds: [missingId.toString()],
          }),
        )
        .catch((thrown: unknown) => thrown);

      expect(error).toBeInstanceOf(HttpException);
      expect([400, 404]).toContain((error as HttpException).getStatus());
      expect(employeeModel.create).not.toHaveBeenCalled();
    });

    it('accepts an omitted serviceIds and stores an empty assignment', async () => {
      const employeeModel = employeeModelMock();
      const service = await buildService(
        employeeModel,
        serviceModelReturning([]),
      );

      await service.create(
        asCreateDto({ name: 'Ada Lovelace', email: 'ada@acme.test' }),
      );

      expect(employeeModel.create).toHaveBeenCalledTimes(1);
      const [payload] = employeeModel.create.mock.calls[0] as [
        Record<string, unknown>,
      ];
      expect(payload).toMatchObject({ serviceIds: [] });
    });

    it('maps a duplicate email index violation to a ConflictException', async () => {
      const serviceId = new Types.ObjectId();
      const employeeModel = employeeModelMock({
        create: jest
          .fn()
          .mockRejectedValue(Object.assign(new Error('dup'), { code: 11000 })),
      });
      const service = await buildService(
        employeeModel,
        serviceModelReturning([serviceId]),
      );

      await expect(
        service.create(
          asCreateDto({
            name: 'Ada Lovelace',
            email: 'ada@acme.test',
            serviceIds: [serviceId.toString()],
          }),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('list', () => {
    it('maps the tenant employees to public dtos reading through a lean projection', async () => {
      const leanQuery = leanReturning([leanEmployee()]);
      const employeeModel = employeeModelMock({
        find: jest.fn().mockReturnValue(leanQuery),
      });
      const service = await buildService(
        employeeModel,
        serviceModelReturning([]),
      );

      const result = await service.list();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(EmployeeResponseDto);
      expect(result[0]).toMatchObject({
        name: 'Ada Lovelace',
        email: 'ada@acme.test',
      });
      expect(result[0]).not.toHaveProperty('tenantId');
      expect(leanQuery.lean).toHaveBeenCalledTimes(1);
    });
  });

  describe('getById', () => {
    it('throws NotFoundException when the employee does not exist', async () => {
      const employeeModel = employeeModelMock({
        findById: jest.fn().mockReturnValue(leanReturning(null)),
        findOne: jest.fn().mockReturnValue(leanReturning(null)),
      });
      const service = await buildService(
        employeeModel,
        serviceModelReturning([]),
      );

      await expect(
        service.getById(new Types.ObjectId().toString()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('reassigns serviceIds validating their existence and returns the updated public dto', async () => {
      const newServiceId = new Types.ObjectId();
      const updatedDoc = leanEmployee({
        name: 'Grace Hopper',
        serviceIds: [newServiceId],
      });
      const employeeModel = employeeModelMock({
        findById: jest.fn().mockReturnValue(leanReturning(updatedDoc)),
        findOne: jest.fn().mockReturnValue(leanReturning(updatedDoc)),
        findByIdAndUpdate: jest.fn().mockReturnValue(leanReturning(updatedDoc)),
        findOneAndUpdate: jest.fn().mockReturnValue(leanReturning(updatedDoc)),
        updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }),
      });
      const service = await buildService(
        employeeModel,
        serviceModelReturning([newServiceId]),
      );

      const result = await service.update(
        '665f1b2c9c1e4a0012ab34cd',
        asUpdateDto({
          name: 'Grace Hopper',
          serviceIds: [newServiceId.toString()],
        }),
      );

      expect(result).toBeInstanceOf(EmployeeResponseDto);
      expect(result).toMatchObject({ name: 'Grace Hopper' });
      expect(result.serviceIds).toEqual([newServiceId.toString()]);
      expect(result).not.toHaveProperty('tenantId');
    });

    it('rejects reassigning a serviceId that does not exist in the tenant and never updates', async () => {
      const missingId = new Types.ObjectId();
      const employeeModel = employeeModelMock();
      const service = await buildService(
        employeeModel,
        serviceModelReturning([]),
      );

      const error: unknown = await service
        .update(
          '665f1b2c9c1e4a0012ab34cd',
          asUpdateDto({ serviceIds: [missingId.toString()] }),
        )
        .catch((thrown: unknown) => thrown);

      expect(error).toBeInstanceOf(HttpException);
      expect([400, 404]).toContain((error as HttpException).getStatus());
      expect(employeeModel.updateOne).not.toHaveBeenCalled();
      expect(employeeModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(employeeModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when updating an employee that does not exist', async () => {
      const employeeModel = employeeModelMock({
        findById: jest.fn().mockReturnValue(leanReturning(null)),
        findOne: jest.fn().mockReturnValue(leanReturning(null)),
        findByIdAndUpdate: jest.fn().mockReturnValue(leanReturning(null)),
        findOneAndUpdate: jest.fn().mockReturnValue(leanReturning(null)),
        updateOne: jest.fn().mockResolvedValue({ matchedCount: 0 }),
      });
      const service = await buildService(
        employeeModel,
        serviceModelReturning([]),
      );

      await expect(
        service.update(
          '665f1b2c9c1e4a0012ab34cd',
          asUpdateDto({ name: 'Grace Hopper' }),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
