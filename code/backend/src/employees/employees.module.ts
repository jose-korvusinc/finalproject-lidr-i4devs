import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { Employee, EmployeeSchema } from './schemas/employee.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
})
export class EmployeesModule {}
