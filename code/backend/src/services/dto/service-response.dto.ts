import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class ServiceResponseDto {
  @ApiProperty({
    description: 'Service identifier',
    example: '665f1b2c9c1e4a0012ab34cd',
  })
  @Expose()
  @Transform(
    ({ obj }: { obj: { _id?: unknown; id?: unknown } }) =>
      String(obj._id ?? obj.id),
    { toClassOnly: true },
  )
  id: string;

  @ApiProperty({ description: 'Service display name', example: 'Haircut' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Price as a decimal string', example: '25.00' })
  @Expose()
  price: string;

  @ApiProperty({ description: 'Service duration in minutes', example: 30 })
  @Expose()
  durationMinutes: number;

  @ApiProperty({ description: 'Whether the service is active', example: true })
  @Expose()
  active: boolean;
}
