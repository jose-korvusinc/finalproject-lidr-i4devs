import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Business } from './schemas/business.schema';
import { TenantsService } from './tenants.service';

interface BusinessModelMock {
  exists: jest.Mock;
}

describe('TenantsService', () => {
  let service: TenantsService;
  let modelMock: BusinessModelMock;

  beforeEach(async () => {
    modelMock = { exists: jest.fn() };

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
});
