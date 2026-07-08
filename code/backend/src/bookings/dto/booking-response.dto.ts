import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class BookingResponseDto {
  @ApiProperty({
    description: 'Booking identifier',
    example: '665f1b2c9c1e4a0012ab34cd',
  })
  @Expose()
  @Transform(
    ({ obj }: { obj: { _id?: string; id?: string } }) => obj._id ?? obj.id,
    {
      toClassOnly: true,
    },
  )
  id: string;

  @ApiProperty({
    description: 'Booking lifecycle status',
    example: 'confirmed',
  })
  @Expose()
  status: string;

  @ApiProperty({
    description: 'Appointment start instant in ISO 8601 UTC',
    example: '2026-07-10T09:00:00.000Z',
  })
  @Expose()
  startsAt: string;
}
