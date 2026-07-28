import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { Weekday } from '../schemas/working-hours.schema';

@Exclude()
export class WeeklyScheduleResponseDto {
  @ApiProperty({
    description: 'Day of the week',
    enum: Weekday,
    example: Weekday.MONDAY,
  })
  @Expose()
  weekday: string;

  @ApiProperty({
    description: 'Whether the tenant works on this day',
    example: true,
  })
  @Expose()
  isWorkingDay: boolean;

  @ApiPropertyOptional({
    description: 'Opening time in 24h HH:mm format',
    example: '09:00',
  })
  @Expose()
  openTime?: string;

  @ApiPropertyOptional({
    description: 'Closing time in 24h HH:mm format',
    example: '18:00',
  })
  @Expose()
  closeTime?: string;

  @ApiPropertyOptional({
    description: 'Break start time in 24h HH:mm format',
    example: '13:00',
  })
  @Expose()
  breakStart?: string;

  @ApiPropertyOptional({
    description: 'Break end time in 24h HH:mm format',
    example: '14:00',
  })
  @Expose()
  breakEnd?: string;
}
