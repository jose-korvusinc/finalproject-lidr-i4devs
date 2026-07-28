import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContextService } from '../context/tenant-context.service';
import { TenantGuard } from './tenant.guard';

interface ReflectorMock {
  getAllAndOverride: jest.Mock;
  get: jest.Mock;
}

describe('TenantGuard', () => {
  let reflector: ReflectorMock;
  let tenantContext: { tenantId: string | undefined };
  let guard: TenantGuard;

  const executionContext = {
    getHandler: () => (): void => undefined,
    getClass: () => class Fake {},
  } as unknown as ExecutionContext;

  const setPublic = (value: boolean): void => {
    reflector.getAllAndOverride.mockReturnValue(value);
    reflector.get.mockReturnValue(value);
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
      get: jest.fn().mockReturnValue(false),
    };
    tenantContext = { tenantId: undefined };
    guard = new TenantGuard(
      reflector as unknown as Reflector,
      tenantContext as unknown as TenantContextService,
    );
  });

  it('allows public handlers even without a resolved tenant', () => {
    setPublic(true);
    tenantContext.tenantId = undefined;

    expect(guard.canActivate(executionContext)).toBe(true);
  });

  it('allows the request when a tenant is resolved', () => {
    setPublic(false);
    tenantContext.tenantId = 'A';

    expect(guard.canActivate(executionContext)).toBe(true);
  });

  it('rejects a non-public request without a resolved tenant (fail-closed)', () => {
    setPublic(false);
    tenantContext.tenantId = undefined;

    expect(() => guard.canActivate(executionContext)).toThrow(
      ForbiddenException,
    );
  });
});
