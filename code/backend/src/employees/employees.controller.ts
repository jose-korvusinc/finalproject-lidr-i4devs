import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@ApiTags('employees')
@Controller({ path: 'employees', version: '1' })
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an employee for the current tenant' })
  @ApiCreatedResponse({ type: EmployeeResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed or an assigned service does not exist',
  })
  @ApiConflictResponse({
    description: 'An employee with the same email already exists',
  })
  @ApiForbiddenResponse({ description: 'Tenant context could not be resolved' })
  create(@Body() dto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    return this.employees.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List the employees of the current tenant' })
  @ApiOkResponse({ type: EmployeeResponseDto, isArray: true })
  @ApiForbiddenResponse({ description: 'Tenant context could not be resolved' })
  list(): Promise<EmployeeResponseDto[]> {
    return this.employees.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an employee of the current tenant by id' })
  @ApiOkResponse({ type: EmployeeResponseDto })
  @ApiNotFoundResponse({ description: 'Employee not found for the tenant' })
  @ApiForbiddenResponse({ description: 'Tenant context could not be resolved' })
  getById(@Param('id') id: string): Promise<EmployeeResponseDto> {
    return this.employees.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update editable fields of an employee' })
  @ApiOkResponse({ type: EmployeeResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed or an assigned service does not exist',
  })
  @ApiConflictResponse({
    description: 'The new email collides with another employee',
  })
  @ApiNotFoundResponse({ description: 'Employee not found for the tenant' })
  @ApiForbiddenResponse({ description: 'Tenant context could not be resolved' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    return this.employees.update(id, dto);
  }
}
