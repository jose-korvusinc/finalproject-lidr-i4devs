import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import {
  Business,
  BusinessDocument,
  TenantStatus,
} from './schemas/business.schema';
import { isReservedSubdomain } from './subdomain.constants';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    private readonly config: ConfigService,
  ) {}

  async isSubdomainAvailable(subdomain: string): Promise<boolean> {
    if (isReservedSubdomain(subdomain)) {
      return false;
    }
    const existing = await this.businessModel.exists({ subdomain });
    return !existing;
  }

  async create(dto: CreateTenantDto): Promise<TenantResponseDto> {
    try {
      const created = await this.businessModel.create({
        name: dto.name,
        subdomain: dto.subdomain,
        status: TenantStatus.ACTIVE,
        schemaVersion: 1,
        owner: { name: dto.name, email: dto.ownerEmail },
      });

      return this.toResponse(created, dto.subdomain);
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Subdomain already taken');
      }
      throw error;
    }
  }

  private toResponse(
    document: Pick<BusinessDocument, '_id' | 'name' | 'subdomain' | 'status'>,
    subdomain: string,
  ): TenantResponseDto {
    return plainToInstance(
      TenantResponseDto,
      {
        _id: document._id,
        name: document.name,
        subdomain: document.subdomain,
        status: document.status,
        portalUrl: `https://${subdomain}.${this.config.getOrThrow<string>(
          'TENANT_BASE_DOMAIN',
        )}`,
      },
      { excludeExtraneousValues: true },
    );
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: number }).code === 11000
    );
  }
}
