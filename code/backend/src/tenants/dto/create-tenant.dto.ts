import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNotIn,
  IsString,
  Matches,
} from 'class-validator';
import {
  RESERVED_SUBDOMAINS,
  SUBDOMAIN_PATTERN,
  SUBDOMAIN_PATTERN_SOURCE,
} from '../subdomain.constants';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Business display name',
    example: 'Barberia Paco',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Owner contact email',
    format: 'email',
    example: 'paco@barberia-paco.test',
  })
  @IsEmail()
  ownerEmail: string;

  @ApiProperty({
    description:
      'Globally unique tenant subdomain slug. Platform-reserved slugs are rejected.',
    pattern: SUBDOMAIN_PATTERN_SOURCE,
    not: { enum: [...RESERVED_SUBDOMAINS] },
    example: 'barberia-paco',
  })
  @IsString()
  @Matches(SUBDOMAIN_PATTERN)
  @IsNotIn([...RESERVED_SUBDOMAINS])
  subdomain: string;
}
