import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './schemas/service.schema';
import { ServicesService } from './services.service';

interface LeanService {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  price: Types.Decimal128;
  durationMinutes: number;
  active: boolean;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

interface ServiceModelMock {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findOne: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findOneAndUpdate: jest.Mock;
  updateOne: jest.Mock;
  deleteOne: jest.Mock;
  findByIdAndDelete: jest.Mock;
}

const leanReturning = (value: unknown): { lean: jest.Mock } => ({
  lean: jest.fn().mockResolvedValue(value),
});

const leanDoc = (overrides: Partial<LeanService> = {}): LeanService => ({
  _id: new Types.ObjectId('665f1b2c9c1e4a0012ab34cd'),
  tenantId: new Types.ObjectId('665f1b2c9c1e4a0012abffff'),
  name: 'Haircut',
  price: Types.Decimal128.fromString('25.00'),
  durationMinutes: 30,
  active: true,
  schemaVersion: 1,
  createdAt: '2026-07-07T09:00:00.000Z',
  updatedAt: '2026-07-07T09:00:00.000Z',
  ...overrides,
});

const asCreateDto = (payload: {
  name: string;
  price: string;
  durationMinutes: number;
}): CreateServiceDto => payload;

const asUpdateDto = (payload: Partial<UpdateServiceDto>): UpdateServiceDto =>
  payload;

const buildService = async (
  model: Partial<ServiceModelMock>,
): Promise<ServicesService> => {
  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      ServicesService,
      { provide: getModelToken(Service.name), useValue: model },
    ],
  }).compile();

  return moduleRef.get(ServicesService);
};

describe('ServicesService', () => {
  describe('create', () => {
    it('sets active true and schemaVersion 1 without ever passing a manual tenantId', async () => {
      const createMock = jest.fn().mockResolvedValue(leanDoc());
      const service = await buildService({ create: createMock });

      await service.create(
        asCreateDto({ name: 'Haircut', price: '25.00', durationMinutes: 30 }),
      );

      expect(createMock).toHaveBeenCalledTimes(1);
      const [payload] = createMock.mock.calls[0] as [Record<string, unknown>];
      expect(payload).toMatchObject({ active: true, schemaVersion: 1 });
      expect(payload).not.toHaveProperty('tenantId');
    });

    it('returns a public dto with price as a string and no internal fields', async () => {
      const createMock = jest.fn().mockResolvedValue(leanDoc());
      const service = await buildService({ create: createMock });

      const result = await service.create(
        asCreateDto({ name: 'Haircut', price: '25.00', durationMinutes: 30 }),
      );

      expect(result).toBeInstanceOf(ServiceResponseDto);
      expect(result).toMatchObject({
        name: 'Haircut',
        durationMinutes: 30,
        active: true,
      });
      expect(result.price).toBe('25.00');
      expect(typeof result.price).toBe('string');
      expect(result).not.toHaveProperty('_id');
      expect(result).not.toHaveProperty('tenantId');
    });
  });

  describe('list', () => {
    it('maps the tenant services to public dtos reading through a lean projection', async () => {
      const leanQuery = leanReturning([leanDoc()]);
      const findMock = jest.fn().mockReturnValue(leanQuery);
      const service = await buildService({ find: findMock });

      const result = await service.list();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ServiceResponseDto);
      expect(result[0]).toMatchObject({
        name: 'Haircut',
        durationMinutes: 30,
        active: true,
      });
      expect(result[0].price).toBe('25.00');
      expect(result[0]).not.toHaveProperty('_id');
      expect(result[0]).not.toHaveProperty('tenantId');
      expect(leanQuery.lean).toHaveBeenCalledTimes(1);
    });

    it('resolves to an empty list when the tenant has no services', async () => {
      const service = await buildService({
        find: jest.fn().mockReturnValue(leanReturning([])),
      });

      await expect(service.list()).resolves.toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns the public dto for an existing service', async () => {
      const service = await buildService({
        findById: jest.fn().mockReturnValue(leanReturning(leanDoc())),
        findOne: jest.fn().mockReturnValue(leanReturning(leanDoc())),
      });

      const result = await service.getById('665f1b2c9c1e4a0012ab34cd');

      expect(result).toBeInstanceOf(ServiceResponseDto);
      expect(result).toMatchObject({ name: 'Haircut', active: true });
      expect(result).not.toHaveProperty('tenantId');
    });

    it('throws NotFoundException when the service does not exist', async () => {
      const service = await buildService({
        findById: jest.fn().mockReturnValue(leanReturning(null)),
        findOne: jest.fn().mockReturnValue(leanReturning(null)),
      });

      await expect(
        service.getById('665f1b2c9c1e4a0012ab34cd'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('applies the editable fields and returns the updated public dto', async () => {
      const updatedDoc = leanDoc({
        name: 'Deluxe haircut',
        price: Types.Decimal128.fromString('30.00'),
        durationMinutes: 45,
      });
      const service = await buildService({
        findById: jest.fn().mockReturnValue(leanReturning(updatedDoc)),
        findOne: jest.fn().mockReturnValue(leanReturning(leanDoc())),
        findByIdAndUpdate: jest.fn().mockReturnValue(leanReturning(updatedDoc)),
        findOneAndUpdate: jest.fn().mockReturnValue(leanReturning(updatedDoc)),
        updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }),
      });

      const result = await service.update(
        '665f1b2c9c1e4a0012ab34cd',
        asUpdateDto({
          name: 'Deluxe haircut',
          price: '30.00',
          durationMinutes: 45,
        }),
      );

      expect(result).toBeInstanceOf(ServiceResponseDto);
      expect(result).toMatchObject({
        name: 'Deluxe haircut',
        durationMinutes: 45,
      });
      expect(result.price).toBe('30.00');
      expect(result).not.toHaveProperty('tenantId');
    });

    it('throws NotFoundException when updating a service that does not exist', async () => {
      const service = await buildService({
        findById: jest.fn().mockReturnValue(leanReturning(null)),
        findOne: jest.fn().mockReturnValue(leanReturning(null)),
        findByIdAndUpdate: jest.fn().mockReturnValue(leanReturning(null)),
        findOneAndUpdate: jest.fn().mockReturnValue(leanReturning(null)),
        updateOne: jest.fn().mockResolvedValue({ matchedCount: 0 }),
      });

      await expect(
        service.update(
          '665f1b2c9c1e4a0012ab34cd',
          asUpdateDto({ name: 'Deluxe haircut' }),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('logically deactivates an existing service through a tenant-scoped updateOne and never deletes it', async () => {
      const deactivatedDoc = leanDoc({ active: false });
      const updateOne = jest.fn().mockResolvedValue({ matchedCount: 1 });
      const deleteOne = jest.fn();
      const findByIdAndDelete = jest.fn();
      const service = await buildService({
        findById: jest.fn().mockReturnValue(leanReturning(deactivatedDoc)),
        findOne: jest.fn().mockReturnValue(leanReturning(deactivatedDoc)),
        updateOne,
        deleteOne,
        findByIdAndDelete,
      });

      const result = await service.deactivate('665f1b2c9c1e4a0012ab34cd');

      expect(updateOne).toHaveBeenCalledTimes(1);
      const [, updatePayload] = updateOne.mock.calls[0] as [
        unknown,
        Record<string, unknown>,
      ];
      expect(updatePayload).toEqual({ $set: { active: false } });
      expect(result).toBeInstanceOf(ServiceResponseDto);
      expect(result.active).toBe(false);
      expect(deleteOne).not.toHaveBeenCalled();
      expect(findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when deactivating a service that does not exist', async () => {
      const service = await buildService({
        findById: jest.fn().mockReturnValue(leanReturning(null)),
        findOne: jest.fn().mockReturnValue(leanReturning(null)),
        updateOne: jest.fn().mockResolvedValue({ matchedCount: 0 }),
        deleteOne: jest.fn(),
        findByIdAndDelete: jest.fn(),
      });

      await expect(
        service.deactivate('665f1b2c9c1e4a0012ab34cd'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
