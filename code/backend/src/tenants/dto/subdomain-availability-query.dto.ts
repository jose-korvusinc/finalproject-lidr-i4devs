import { IsString, Matches } from 'class-validator';
import { SUBDOMAIN_PATTERN } from './subdomain.constants';

export class SubdomainAvailabilityQueryDto {
  @IsString()
  @Matches(SUBDOMAIN_PATTERN)
  subdomain: string;
}
