import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { SubdomainAvailabilityQueryDto } from './dto/subdomain-availability-query.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { TenantsService } from './tenants.service';

@Controller({ path: 'tenants', version: '1' })
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get('subdomain-availability')
  async checkSubdomainAvailability(
    @Query() query: SubdomainAvailabilityQueryDto,
  ): Promise<{ available: boolean }> {
    return {
      available: await this.tenants.isSubdomainAvailable(query.subdomain),
    };
  }

  @Post()
  create(@Body() dto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenants.create(dto);
  }
}
