import { Request, Response } from 'express';
import { Model } from 'mongoose';
import { Business } from '../schemas/business.schema';
import { TenantContextMiddleware } from './tenant-context.middleware';
import { TenantStore, tenantStorage } from './tenant-context.storage';

interface QueryMock {
  select: jest.Mock;
  lean: jest.Mock;
}

interface BusinessModelMock {
  findOne: jest.Mock;
}

describe('TenantContextMiddleware', () => {
  let query: QueryMock;
  let modelMock: BusinessModelMock;
  let middleware: TenantContextMiddleware;

  beforeEach(() => {
    query = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: 'A' }),
    };
    modelMock = { findOne: jest.fn().mockReturnValue(query) };
    middleware = new TenantContextMiddleware(
      modelMock as unknown as Model<Business>,
    );
  });

  const runMiddleware = (hostname: string): Promise<TenantStore | undefined> =>
    new Promise((resolve) => {
      const req = { hostname } as unknown as Request;
      const res = {} as Response;
      const next = (): void => resolve(tenantStorage.getStore());
      void middleware.use(req, res, next);
    });

  it('resolves the tenant from the subdomain and exposes it in the request scope', async () => {
    const store = await runMiddleware('acme.app.com');

    expect(store?.tenantId).toBe('A');
    expect(store?.requestId).toBeDefined();
    expect(modelMock.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ subdomain: 'acme' }),
    );
  });

  it('does not resolve a tenant for the www subdomain', async () => {
    const store = await runMiddleware('www.app.com');

    expect(store?.tenantId).toBeUndefined();
  });

  it('does not resolve a tenant for a bare localhost host', async () => {
    const store = await runMiddleware('localhost');

    expect(store?.tenantId).toBeUndefined();
  });

  it('opens a request scope with a requestId even when no tenant resolves', async () => {
    const store = await runMiddleware('localhost');

    expect(store?.requestId).toBeDefined();
  });
});
