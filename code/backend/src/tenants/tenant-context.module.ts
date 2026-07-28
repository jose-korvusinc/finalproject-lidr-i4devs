import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantContextMiddleware } from './context/tenant-context.middleware';
import { TenantContextService } from './context/tenant-context.service';
import { TenantGuard } from './guards/tenant.guard';
import { Business, BusinessSchema } from './schemas/business.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Business.name, schema: BusinessSchema },
    ]),
  ],
  providers: [
    TenantContextService,
    { provide: APP_GUARD, useClass: TenantGuard },
  ],
  exports: [TenantContextService],
})
export class TenantContextModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
