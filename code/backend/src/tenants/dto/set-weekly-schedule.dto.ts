import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { WorkingHourDto } from './working-hour.dto';

@ValidatorConstraint({ name: 'uniqueWeekdays', async: false })
class UniqueWeekdaysConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!Array.isArray(value)) {
      return true;
    }
    const weekdays = value
      .map((day) => (day as WorkingHourDto)?.weekday)
      .filter((weekday) => weekday !== undefined && weekday !== null);
    return new Set(weekdays).size === weekdays.length;
  }

  defaultMessage(): string {
    return 'weekdays must not be duplicated';
  }
}

export class SetWeeklyScheduleDto {
  @ApiProperty({
    description: 'Working hours for each configured weekday',
    type: () => [WorkingHourDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourDto)
  @Validate(UniqueWeekdaysConstraint)
  days: WorkingHourDto[];
}
