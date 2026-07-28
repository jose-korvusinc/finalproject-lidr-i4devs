import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { SubdomainAvailabilityQueryDto } from './dto/subdomain-availability-query.dto';
import { SubdomainAvailabilityResponseDto } from './dto/subdomain-availability-response.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { Public } from './guards/public.decorator';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@Public()
@Controller({ path: 'tenants', version: '1' })
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get('subdomain-availability')
  @ApiOperation({
    summary: 'Check tenant subdomain availability',
    description:
      'Public pre-tenant endpoint that reports whether a subdomain slug is free to register.',
  })
  @ApiOkResponse({
    description: 'Subdomain availability result',
    type: SubdomainAvailabilityResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Missing subdomain query or invalid slug format',
  })
  async checkSubdomainAvailability(
    @Query() query: SubdomainAvailabilityQueryDto,
  ): Promise<SubdomainAvailabilityResponseDto> {
    return {
      available: await this.tenants.isSubdomainAvailable(query.subdomain),
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Register a tenant',
    description:
      'Public pre-tenant endpoint that registers a business tenant with a globally unique subdomain.',
  })
  @ApiCreatedResponse({
    description: 'Tenant registered',
    type: TenantResponseDto,
  })
  @ApiConflictResponse({ description: 'Subdomain already taken' })
  @ApiBadRequestResponse({
    description: 'Validation failed (email, slug, or forbidden property)',
  })
  create(@Body() dto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenants.create(dto);
  }
}
