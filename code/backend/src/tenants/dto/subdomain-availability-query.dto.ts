import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import {
  SUBDOMAIN_PATTERN,
  SUBDOMAIN_PATTERN_SOURCE,
} from './subdomain.constants';

export class SubdomainAvailabilityQueryDto {
  @ApiProperty({
    description: 'Tenant subdomain slug to check for availability',
    pattern: SUBDOMAIN_PATTERN_SOURCE,
    example: 'barberia-ana',
  })
  @IsString()
  @Matches(SUBDOMAIN_PATTERN)
  subdomain: string;
}
