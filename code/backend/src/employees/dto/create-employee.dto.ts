import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ description: 'Employee full name', example: 'Ada Lovelace' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Employee contact email',
    example: 'ada@acme.test',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Identifiers of the services assigned to the employee',
    type: [String],
    example: ['665f1b2c9c1e4a0012ab34cd'],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  serviceIds?: string[];
}
