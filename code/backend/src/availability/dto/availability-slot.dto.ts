import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AvailabilitySlotDto {
  @ApiProperty({
    description: 'Slot start instant in ISO 8601 UTC',
    example: '2026-07-10T09:00:00.000Z',
  })
  @Expose()
  startsAt: string;

  @ApiProperty({
    description: 'Slot end instant in ISO 8601 UTC',
    example: '2026-07-10T09:30:00.000Z',
  })
  @Expose()
  endsAt: string;
}
