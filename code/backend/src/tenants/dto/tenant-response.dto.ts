import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class TenantResponseDto {
  @Expose()
  @Transform(
    ({ obj }: { obj: { _id?: string; id?: string } }) => obj._id ?? obj.id,
    {
      toClassOnly: true,
    },
  )
  id: string;

  @Expose()
  name: string;

  @Expose()
  subdomain: string;

  @Expose()
  status: string;

  @Expose()
  portalUrl: string;
}
