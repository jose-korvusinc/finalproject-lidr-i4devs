import { randomUUID } from 'node:crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { NextFunction, Request, Response } from 'express';
import { Model } from 'mongoose';
import { Business, BusinessDocument } from '../schemas/business.schema';
import { tenantStorage } from './tenant-context.storage';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const tenantId = await this.resolveTenantId(req.hostname);
    tenantStorage.run({ tenantId, requestId: randomUUID() }, () => next());
  }

  private async resolveTenantId(hostname: string): Promise<string | undefined> {
    const label = hostname.split('.')[0];
    if (this.isReservedHost(hostname, label)) {
      return undefined;
    }
    const doc = await this.businessModel.findOne({ subdomain: label }).lean();
    return doc?._id?.toString();
  }

  private isReservedHost(hostname: string, label: string): boolean {
    return (
      hostname === 'localhost' || label === 'www' || this.isIpAddress(hostname)
    );
  }

  private isIpAddress(hostname: string): boolean {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':');
  }
}
