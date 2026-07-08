import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  Matches,
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Weekday } from '../schemas/working-hours.schema';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIME_PATTERN_SOURCE = TIME_PATTERN.source;

function toMinutes(value?: string): number | null {
  if (typeof value !== 'string' || !TIME_PATTERN.test(value)) {
    return null;
  }
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

@ValidatorConstraint({ name: 'workingHourRange', async: false })
class WorkingHourRangeConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as WorkingHourDto;
    if (!dto.isWorkingDay) {
      return true;
    }
    const open = toMinutes(dto.openTime);
    const close = toMinutes(dto.closeTime);
    if (open === null || close === null) {
      return true;
    }
    if (open >= close) {
      return false;
    }
    const hasBreakStart =
      dto.breakStart !== undefined && dto.breakStart !== null;
    const hasBreakEnd = dto.breakEnd !== undefined && dto.breakEnd !== null;
    if (hasBreakStart !== hasBreakEnd) {
      return false;
    }
    if (hasBreakStart && hasBreakEnd) {
      const breakStart = toMinutes(dto.breakStart);
      const breakEnd = toMinutes(dto.breakEnd);
      if (breakStart === null || breakEnd === null) {
        return true;
      }
      if (!(open <= breakStart && breakStart < breakEnd && breakEnd <= close)) {
        return false;
      }
    }
    return true;
  }

  defaultMessage(): string {
    return 'working hour range is invalid';
  }
}

export class WorkingHourDto {
  @ApiProperty({
    description: 'Day of the week',
    enum: Weekday,
    example: Weekday.MONDAY,
  })
  @IsEnum(Weekday)
  @Validate(WorkingHourRangeConstraint)
  weekday: Weekday;

  @ApiProperty({
    description: 'Whether the tenant works on this day',
    example: true,
  })
  @IsBoolean()
  isWorkingDay: boolean;

  @ApiPropertyOptional({
    description: 'Opening time in 24h HH:mm format',
    pattern: TIME_PATTERN_SOURCE,
    example: '09:00',
  })
  @ValidateIf((dto: WorkingHourDto) => dto.isWorkingDay)
  @Matches(TIME_PATTERN)
  openTime?: string;

  @ApiPropertyOptional({
    description: 'Closing time in 24h HH:mm format',
    pattern: TIME_PATTERN_SOURCE,
    example: '18:00',
  })
  @ValidateIf((dto: WorkingHourDto) => dto.isWorkingDay)
  @Matches(TIME_PATTERN)
  closeTime?: string;

  @ApiPropertyOptional({
    description: 'Break start time in 24h HH:mm format',
    pattern: TIME_PATTERN_SOURCE,
    example: '13:00',
  })
  @IsOptional()
  @Matches(TIME_PATTERN)
  breakStart?: string;

  @ApiPropertyOptional({
    description: 'Break end time in 24h HH:mm format',
    pattern: TIME_PATTERN_SOURCE,
    example: '14:00',
  })
  @IsOptional()
  @Matches(TIME_PATTERN)
  breakEnd?: string;
}
