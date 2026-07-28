import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WorkingHours,
  WorkingHoursSchema,
} from '../tenants/schemas/working-hours.schema';
import { WorkingHoursController } from './working-hours.controller';
import { WorkingHoursService } from './working-hours.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkingHours.name, schema: WorkingHoursSchema },
    ]),
  ],
  controllers: [WorkingHoursController],
  providers: [WorkingHoursService],
})
export class WorkingHoursModule {}
