import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class EmployeeResponseDto {
  @ApiProperty({
    description: 'Employee identifier',
    example: '665f1b2c9c1e4a0012ab34cd',
  })
  @Expose()
  @Transform(
    ({ obj }: { obj: { _id?: unknown; id?: unknown } }) =>
      String(obj._id ?? obj.id),
    { toClassOnly: true },
  )
  id: string;

  @ApiProperty({ description: 'Employee full name', example: 'Ada Lovelace' })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Employee contact email',
    example: 'ada@acme.test',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'Identifiers of the services assigned to the employee',
    type: [String],
    example: ['665f1b2c9c1e4a0012ab34cd'],
  })
  @Expose()
  serviceIds: string[];
}
