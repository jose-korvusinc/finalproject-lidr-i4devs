import { ConflictException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { Business } from './schemas/business.schema';
import { TenantsService } from './tenants.service';

interface BusinessModelMock {
  exists: jest.Mock;
  create: jest.Mock;
}

type CreatableTenantsService = TenantsService & {
  create(dto: CreateTenantDto): Promise<TenantResponseDto>;
};

const createTenant = (
  service: TenantsService,
  dto: CreateTenantDto,
): Promise<TenantResponseDto> =>
  (service as CreatableTenantsService).create(dto);

describe('TenantsService', () => {
  let service: TenantsService;
  let modelMock: BusinessModelMock;

  beforeEach(async () => {
    modelMock = { exists: jest.fn(), create: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: getModelToken(Business.name), useValue: modelMock },
      ],
    }).compile();

    service = moduleRef.get(TenantsService);
  });

  describe('isSubdomainAvailable', () => {
    it('returns true when no business owns the subdomain', async () => {
      modelMock.exists.mockResolvedValue(null);

      const available = await service.isSubdomainAvailable('barberia-ana');

      expect(available).toBe(true);
    });

    it('returns false when a business already owns the subdomain', async () => {
      modelMock.exists.mockResolvedValue({ _id: 'existing-id' });

      const available = await service.isSubdomainAvailable('barberia-paco');

      expect(available).toBe(false);
    });

    it('filters by the requested subdomain with a minimal existence check', async () => {
      modelMock.exists.mockResolvedValue(null);

      await service.isSubdomainAvailable('barberia-ana');

      expect(modelMock.exists).toHaveBeenCalledTimes(1);
      expect(modelMock.exists).toHaveBeenCalledWith(
        expect.objectContaining({ subdomain: 'barberia-ana' }),
      );
    });
  });

  describe('create', () => {
    const dto: CreateTenantDto = {
      name: 'Barberia Paco',
      ownerEmail: 'paco@barberia-paco.test',
      subdomain: 'barberia-paco',
    };

    const persistedDoc = {
      _id: 'abc123',
      name: 'Barberia Paco',
      subdomain: 'barberia-paco',
      status: 'active',
      owner: { name: 'Barberia Paco', email: 'paco@barberia-paco.test' },
      schemaVersion: 1,
    };

    it('registers the business and returns its public representation with a derived portal url', async () => {
      modelMock.create.mockResolvedValue(persistedDoc);

      const result = await createTenant(service, dto);

      expect(result.id).toBe('abc123');
      expect(result.name).toBe('Barberia Paco');
      expect(result.subdomain).toBe('barberia-paco');
      expect(result.status).toBe('active');
      expect(result.portalUrl).toBe('https://barberia-paco.yourplatform.com');
    });

    it('does not expose internal or owner fields in the returned dto', async () => {
      modelMock.create.mockResolvedValue(persistedDoc);

      const result = await createTenant(service, dto);

      expect(result).not.toHaveProperty('owner');
      expect(result).not.toHaveProperty('_id');
      expect(result).not.toHaveProperty('tenantId');
      expect(result).not.toHaveProperty('schemaVersion');
    });

    it('persists the active status and maps the owner from the dto', async () => {
      modelMock.create.mockResolvedValue(persistedDoc);

      await createTenant(service, dto);

      expect(modelMock.create).toHaveBeenCalledTimes(1);
      expect(modelMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Barberia Paco',
          subdomain: 'barberia-paco',
          status: 'active',
          owner: expect.objectContaining({
            name: 'Barberia Paco',
            email: 'paco@barberia-paco.test',
          }) as unknown,
        }),
      );
    });

    it('translates a duplicate key error into a ConflictException', async () => {
      modelMock.create.mockRejectedValue(
        Object.assign(new Error('dup'), { code: 11000 }),
      );

      await expect(createTenant(service, dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
