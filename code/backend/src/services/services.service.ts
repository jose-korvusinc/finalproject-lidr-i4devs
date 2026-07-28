import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service, ServiceDocument } from './schemas/service.schema';

interface ServiceReadModel {
  _id: unknown;
  name: string;
  price: Types.Decimal128;
  durationMinutes: number;
  active: boolean;
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async create(dto: CreateServiceDto): Promise<ServiceResponseDto> {
    const created = await this.serviceModel.create({
      name: dto.name,
      price: dto.price,
      durationMinutes: dto.durationMinutes,
      active: true,
      schemaVersion: 1,
    });
    return this.toDto(created);
  }

  async list(): Promise<ServiceResponseDto[]> {
    const docs = await this.serviceModel
      .find({ active: true })
      .lean<ServiceReadModel[]>();
    return docs.map((doc) => this.toDto(doc));
  }

  async getById(id: string): Promise<ServiceResponseDto> {
    const doc = await this.serviceModel.findById(id).lean<ServiceReadModel>();
    if (!doc) {
      throw new NotFoundException();
    }
    return this.toDto(doc);
  }

  async update(id: string, dto: UpdateServiceDto): Promise<ServiceResponseDto> {
    const changes: Partial<{
      name: string;
      price: string;
      durationMinutes: number;
    }> = {};
    if (dto.name !== undefined) {
      changes.name = dto.name;
    }
    if (dto.price !== undefined) {
      changes.price = dto.price;
    }
    if (dto.durationMinutes !== undefined) {
      changes.durationMinutes = dto.durationMinutes;
    }

    const result = await this.serviceModel.updateOne(
      { _id: id },
      { $set: changes },
    );
    if (result.matchedCount === 0) {
      throw new NotFoundException();
    }
    return this.getById(id);
  }

  async deactivate(id: string): Promise<ServiceResponseDto> {
    const result = await this.serviceModel.updateOne(
      { _id: id },
      { $set: { active: false } },
    );
    if (result.matchedCount === 0) {
      throw new NotFoundException();
    }
    return this.getById(id);
  }

  private toDto(source: ServiceReadModel): ServiceResponseDto {
    return plainToInstance(
      ServiceResponseDto,
      {
        _id: source._id,
        name: source.name,
        price: source.price.toString(),
        durationMinutes: source.durationMinutes,
        active: source.active,
      },
      { excludeExtraneousValues: true },
    );
  }
}
