import { Injectable } from '@nestjs/common';
import { TenantStore, tenantStorage } from './tenant-context.storage';

@Injectable()
export class TenantContextService {
  run<T>(store: TenantStore, callback: () => T): T {
    return tenantStorage.run(store, callback);
  }

  get tenantId(): string | undefined {
    return tenantStorage.getStore()?.tenantId;
  }

  get requestId(): string | undefined {
    return tenantStorage.getStore()?.requestId;
  }
}
