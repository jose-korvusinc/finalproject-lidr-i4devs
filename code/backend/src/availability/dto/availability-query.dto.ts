import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsMongoId } from 'class-validator';

export class AvailabilityQueryDto {
  @ApiProperty({
    description: 'Service identifier to compute availability for',
    example: '665f1b2c9c1e4a0012ab0001',
  })
  @IsMongoId()
  serviceId: string;

  @ApiProperty({
    description: 'Employee identifier to compute availability for',
    example: '665f1b2c9c1e4a0012ab0002',
  })
  @IsMongoId()
  employeeId: string;

  @ApiProperty({
    description: 'Target day in YYYY-MM-DD format',
    example: '2026-07-10',
  })
  @IsISO8601({ strict: true })
  date: string;
}
