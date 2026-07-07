import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { SUBDOMAIN_PATTERN } from './subdomain.constants';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  ownerEmail: string;

  @IsString()
  @Matches(SUBDOMAIN_PATTERN)
  subdomain: string;
}
