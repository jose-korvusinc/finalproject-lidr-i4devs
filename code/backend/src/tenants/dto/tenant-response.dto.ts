import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { TenantStatus } from '../schemas/business.schema';

@Exclude()
export class TenantResponseDto {
  @ApiProperty({
    description: 'Tenant identifier',
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
    description: 'Business display name',
    example: 'Barberia Paco',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Globally unique tenant subdomain slug',
    example: 'barberia-paco',
  })
  @Expose()
  subdomain: string;

  @ApiProperty({
    description: 'Tenant lifecycle status',
    enum: TenantStatus,
    example: TenantStatus.ACTIVE,
  })
  @Expose()
  status: string;

  @ApiProperty({
    description: 'Public portal URL of the tenant',
    example: 'https://barberia-paco.yourplatform.com',
  })
  @Expose()
  portalUrl: string;
}
