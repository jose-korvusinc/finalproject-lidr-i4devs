import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Appointment,
  AppointmentSchema,
} from '../appointments/schemas/appointment.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import {
  WorkingHours,
  WorkingHoursSchema,
} from '../tenants/schemas/working-hours.schema';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkingHours.name, schema: WorkingHoursSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
})
export class AvailabilityModule {}
