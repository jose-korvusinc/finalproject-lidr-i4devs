import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  SUBDOMAIN_PATTERN,
  SUBDOMAIN_PATTERN_SOURCE,
} from './subdomain.constants';

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
    description: 'Globally unique tenant subdomain slug',
    pattern: SUBDOMAIN_PATTERN_SOURCE,
    example: 'barberia-paco',
  })
  @IsString()
  @Matches(SUBDOMAIN_PATTERN)
  subdomain: string;
}
