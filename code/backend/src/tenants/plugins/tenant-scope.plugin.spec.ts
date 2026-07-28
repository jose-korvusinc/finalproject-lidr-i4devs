import { ForbiddenException } from '@nestjs/common';
import { tenantStorage } from '../context/tenant-context.storage';
import { tenantFilter } from './tenant-scope.plugin';

describe('tenantFilter', () => {
  it('returns the tenant filter from the active store', () => {
    const filter = tenantStorage.run({ tenantId: 'A', requestId: 'r' }, () =>
      tenantFilter(),
    );

    expect(filter).toEqual({ tenantId: 'A' });
  });

  it('throws ForbiddenException when there is no tenant context', () => {
    expect(() => tenantFilter()).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when the active store lacks a tenantId', () => {
    tenantStorage.run({ requestId: 'r' }, () => {
      expect(() => tenantFilter()).toThrow(ForbiddenException);
    });
  });
});
