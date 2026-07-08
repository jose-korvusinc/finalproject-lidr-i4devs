import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantContextModule } from './tenants/tenant-context.module';
import { TenantsModule } from './tenants/tenants.module';
import { WorkingHoursModule } from './working-hours/working-hours.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        dbName: config.get<string>('MONGODB_DB'),
      }),
    }),
    TenantContextModule,
    TenantsModule,
    WorkingHoursModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
