import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Business, BusinessDocument } from './schemas/business.schema';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
  ) {}

  async isSubdomainAvailable(subdomain: string): Promise<boolean> {
    const existing = await this.businessModel.exists({ subdomain });
    return !existing;
  }
}
