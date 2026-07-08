import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
}
