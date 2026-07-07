import { Controller, Get, Query } from '@nestjs/common';
import { SubdomainAvailabilityQueryDto } from './dto/subdomain-availability-query.dto';
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
}
