import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantStore {
  tenantId?: string;
  requestId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>();
