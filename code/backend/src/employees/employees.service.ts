import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee, EmployeeDocument } from './schemas/employee.schema';

interface EmployeeReadModel {
  _id: unknown;
  name: string;
  email: string;
  serviceIds: unknown[];
}

interface DuplicateKeyError {
  code?: number;
}

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async create(dto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    const serviceIds = dto.serviceIds ?? [];
    await this.assertServicesExist(serviceIds);

    try {
      const created = await this.employeeModel.create({
        name: dto.name,
        email: dto.email,
        serviceIds,
        schemaVersion: 1,
      });
      return this.toDto(created);
    } catch (error) {
      if ((error as DuplicateKeyError).code === 11000) {
        throw new ConflictException();
      }
      throw error;
    }
  }

  async list(): Promise<EmployeeResponseDto[]> {
    const docs = await this.employeeModel.find().lean<EmployeeReadModel[]>();
    return docs.map((doc) => this.toDto(doc));
  }

  async getById(id: string): Promise<EmployeeResponseDto> {
    const doc = await this.employeeModel.findById(id).lean<EmployeeReadModel>();
    if (!doc) {
      throw new NotFoundException();
    }
    return this.toDto(doc);
  }

  async update(
    id: string,
    dto: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    if (dto.serviceIds !== undefined) {
      await this.assertServicesExist(dto.serviceIds);
    }

    const changes: Partial<{
      name: string;
      email: string;
      serviceIds: string[];
    }> = {};
    if (dto.name !== undefined) {
      changes.name = dto.name;
    }
    if (dto.email !== undefined) {
      changes.email = dto.email;
    }
    if (dto.serviceIds !== undefined) {
      changes.serviceIds = dto.serviceIds;
    }

    const result = await this.employeeModel.updateOne(
      { _id: id },
      { $set: changes },
    );
    if (result.matchedCount === 0) {
      throw new NotFoundException();
    }
    return this.getById(id);
  }

  private async assertServicesExist(serviceIds: string[]): Promise<void> {
    if (serviceIds.length === 0) {
      return;
    }
    const ids = serviceIds.map((id) => new Types.ObjectId(id));
    const found = await this.serviceModel
      .find({ _id: { $in: ids } })
      .lean<{ _id: unknown }[]>();
    const uniqueRequested = new Set(serviceIds).size;
    if (found.length < uniqueRequested) {
      throw new BadRequestException();
    }
  }

  private toDto(source: EmployeeReadModel): EmployeeResponseDto {
    return plainToInstance(
      EmployeeResponseDto,
      {
        _id: source._id,
        name: source.name,
        email: source.email,
        serviceIds: source.serviceIds.map((serviceId) => String(serviceId)),
      },
      { excludeExtraneousValues: true },
    );
  }
}
