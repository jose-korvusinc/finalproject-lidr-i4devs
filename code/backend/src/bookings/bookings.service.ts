import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import {
  Appointment,
  AppointmentDocument,
  BookingStatus,
} from '../appointments/schemas/appointment.schema';
import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema';
import {
  Employee,
  EmployeeDocument,
} from '../employees/schemas/employee.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { BookingResponseDto } from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

const MINUTE_IN_MS = 60 * 1000;

interface ServiceReadModel {
  _id: unknown;
  durationMinutes: number;
}

interface EmployeeReadModel {
  _id: unknown;
  serviceIds: unknown[];
}

interface CustomerReadModel {
  _id: Types.ObjectId;
}

interface DuplicateKeyError {
  code?: number;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
  ) {}

  async create(dto: CreateBookingDto): Promise<BookingResponseDto> {
    const service = await this.serviceModel
      .findById(dto.serviceId)
      .lean<ServiceReadModel>();
    if (!service) {
      throw new BadRequestException();
    }

    await this.assertEmployeeEnabled(dto.employeeId, dto.serviceId);

    const startTime = new Date(dto.startsAt);
    const endTime = new Date(
      startTime.getTime() + service.durationMinutes * MINUTE_IN_MS,
    );

    const customerId = await this.upsertCustomer(dto);

    try {
      const created = await this.appointmentModel.create({
        serviceId: new Types.ObjectId(dto.serviceId),
        employeeId: new Types.ObjectId(dto.employeeId),
        customerId,
        startTime,
        endTime,
        status: BookingStatus.PENDING,
        schemaVersion: 1,
      });
      return plainToInstance(
        BookingResponseDto,
        {
          _id: String(created._id),
          status: created.status,
          startsAt: startTime.toISOString(),
        },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      if ((error as DuplicateKeyError).code === 11000) {
        throw new ConflictException();
      }
      throw error;
    }
  }

  private async assertEmployeeEnabled(
    employeeId: string,
    serviceId: string,
  ): Promise<void> {
    const employee = await this.employeeModel
      .findById(employeeId)
      .lean<EmployeeReadModel>();
    const enabled =
      employee?.serviceIds.some((id) => String(id) === serviceId) ?? false;
    if (!enabled) {
      throw new BadRequestException();
    }
  }

  private async upsertCustomer(dto: CreateBookingDto): Promise<Types.ObjectId> {
    const { name, email, phone } = dto.customer;
    const existing = await this.customerModel
      .findOne({ email })
      .lean<CustomerReadModel>();
    if (existing) {
      await this.customerModel.updateOne({ email }, { $set: { name, phone } });
      return existing._id;
    }
    const created = await this.customerModel.create({
      name,
      email,
      phone,
      schemaVersion: 1,
    });
    return created._id;
  }
}
