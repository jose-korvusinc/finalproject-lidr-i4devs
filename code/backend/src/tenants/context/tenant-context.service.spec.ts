import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(() => {
    service = new TenantContextService();
  });

  it('exposes tenantId and requestId within a run scope', () => {
    service.run({ tenantId: 'A', requestId: 'r1' }, () => {
      expect(service.tenantId).toBe('A');
      expect(service.requestId).toBe('r1');
    });
  });

  it('returns undefined for tenantId and requestId outside of a run scope', () => {
    expect(service.tenantId).toBeUndefined();
    expect(service.requestId).toBeUndefined();
  });

  it('returns the callback result from run', () => {
    const result = service.run({ tenantId: 'A', requestId: 'r1' }, () => 42);

    expect(result).toBe(42);
  });

  it('does not leak the tenant context after run completes', () => {
    service.run({ tenantId: 'A', requestId: 'r1' }, () => undefined);

    expect(service.tenantId).toBeUndefined();
  });
});
