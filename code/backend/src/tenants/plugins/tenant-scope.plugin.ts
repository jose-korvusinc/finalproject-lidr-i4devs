import { ForbiddenException } from '@nestjs/common';
import {
  Aggregate,
  Document,
  MongooseQueryMiddleware,
  PipelineStage,
  Query,
  Schema,
} from 'mongoose';
import { tenantStorage } from '../context/tenant-context.storage';

const TENANT_SCOPED_QUERY_HOOKS: MongooseQueryMiddleware[] = [
  'find',
  'findOne',
  'countDocuments',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
];

export function tenantFilter(): { tenantId: string } {
  const store = tenantStorage.getStore();
  if (!store?.tenantId) {
    throw new ForbiddenException('Missing tenant context');
  }
  return { tenantId: store.tenantId };
}

export function tenantScopePlugin(schema: Schema): void {
  schema.pre(
    TENANT_SCOPED_QUERY_HOOKS,
    function (this: Query<unknown, unknown>) {
      this.where(tenantFilter());
    },
  );

  schema.pre('aggregate', function (this: Aggregate<unknown>) {
    const match: PipelineStage.Match = { $match: tenantFilter() };
    this.pipeline().unshift(match);
  });

  schema.pre('validate', function (this: Document) {
    const store = tenantStorage.getStore();
    if (!store?.tenantId) {
      throw new ForbiddenException('Missing tenant context');
    }
    this.set('tenantId', store.tenantId);
  });
}
