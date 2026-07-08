import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SetWeeklyScheduleDto } from '../tenants/dto/set-weekly-schedule.dto';
import { WeeklyScheduleResponseDto } from '../tenants/dto/weekly-schedule-response.dto';
import { WorkingHoursService } from './working-hours.service';

@ApiTags('working-hours')
@Controller({ path: 'working-hours', version: '1' })
export class WorkingHoursController {
  constructor(private readonly workingHours: WorkingHoursService) {}

  @Get()
  @ApiOperation({
    summary: 'List tenant weekly working hours',
    description:
      'Tenant-scoped endpoint that returns the weekly schedule rules of the active tenant.',
  })
  @ApiOkResponse({ type: WeeklyScheduleResponseDto, isArray: true })
  list(): Promise<WeeklyScheduleResponseDto[]> {
    return this.workingHours.list();
  }

  @Put()
  @ApiOperation({
    summary: 'Upsert tenant weekly working hours',
    description:
      'Tenant-scoped endpoint that persists the weekly schedule of the active tenant, upserting one rule per weekday.',
  })
  @ApiOkResponse({ type: WeeklyScheduleResponseDto, isArray: true })
  @ApiBadRequestResponse({
    description:
      'Invalid schedule: bad time range, break outside range, duplicated weekday or a forbidden property such as tenantId in the body.',
  })
  save(
    @Body() dto: SetWeeklyScheduleDto,
  ): Promise<WeeklyScheduleResponseDto[]> {
    return this.workingHours.save(dto);
  }
}
