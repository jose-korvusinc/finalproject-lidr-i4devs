import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('services')
@Controller({ path: 'services', version: '1' })
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a service for the current tenant' })
  @ApiOkResponse({ type: ServiceResponseDto })
  @ApiForbiddenResponse({ description: 'Tenant context could not be resolved' })
  create(@Body() dto: CreateServiceDto): Promise<ServiceResponseDto> {
    return this.services.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List the active services of the current tenant' })
  @ApiOkResponse({ type: ServiceResponseDto, isArray: true })
  @ApiForbiddenResponse({ description: 'Tenant context could not be resolved' })
  list(): Promise<ServiceResponseDto[]> {
    return this.services.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service of the current tenant by id' })
  @ApiOkResponse({ type: ServiceResponseDto })
  @ApiNotFoundResponse({ description: 'Service not found for the tenant' })
  @ApiForbiddenResponse({ description: 'Tenant context could not be resolved' })
  getById(@Param('id') id: string): Promise<ServiceResponseDto> {
    return this.services.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update editable fields of a service' })
  @ApiOkResponse({ type: ServiceResponseDto })
  @ApiNotFoundResponse({ description: 'Service not found for the tenant' })
  @ApiForbiddenResponse({ description: 'Tenant context could not be resolved' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.services.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Logically deactivate a service of the tenant' })
  @ApiOkResponse({ type: ServiceResponseDto })
  @ApiNotFoundResponse({ description: 'Service not found for the tenant' })
  @ApiForbiddenResponse({ description: 'Tenant context could not be resolved' })
  deactivate(@Param('id') id: string): Promise<ServiceResponseDto> {
    return this.services.deactivate(id);
  }
}
