import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsISO8601,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{5,}$/;
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export class CustomerContactDto {
  @ApiProperty({ description: 'Customer full name', example: 'Ada Lovelace' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Customer contact email',
    example: 'ada@acme.test',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Customer contact phone number',
    example: '+34600000000',
  })
  @IsString()
  @Matches(PHONE_PATTERN)
  phone: string;
}

export class CreateBookingDto {
  @ApiProperty({
    description: 'Identifier of the booked service',
    example: '665f1b2c9c1e4a0012ab0001',
  })
  @IsMongoId()
  serviceId: string;

  @ApiProperty({
    description: 'Identifier of the assigned employee',
    example: '665f1b2c9c1e4a0012ab0002',
  })
  @IsMongoId()
  employeeId: string;

  @ApiProperty({
    description: 'Appointment start instant in ISO 8601 UTC',
    example: '2026-07-10T09:00:00.000Z',
  })
  @IsISO8601({ strict: true })
  @Matches(DATE_TIME_PATTERN)
  startsAt: string;

  @ApiProperty({
    description: 'Customer contact details',
    type: CustomerContactDto,
  })
  @ValidateNested()
  @Type(() => CustomerContactDto)
  customer: CustomerContactDto;
}
