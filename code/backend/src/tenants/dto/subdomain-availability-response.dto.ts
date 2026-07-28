import { ApiProperty } from '@nestjs/swagger';

export class SubdomainAvailabilityResponseDto {
  @ApiProperty({
    description: 'Whether the subdomain is free to register',
    example: true,
  })
  available: boolean;
}
