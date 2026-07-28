import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Appointment,
  AppointmentSchema,
} from '../appointments/schemas/appointment.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Employee.name, schema: EmployeeSchema },
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
