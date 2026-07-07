import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

const SUBDOMAIN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
