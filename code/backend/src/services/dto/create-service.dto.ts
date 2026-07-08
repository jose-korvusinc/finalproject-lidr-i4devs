import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

export class CreateServiceDto {
  @ApiProperty({ description: 'Service display name', example: 'Haircut' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description:
      'Non-negative price as a decimal string with up to two decimals',
    example: '25.00',
  })
  @IsString()
  @Matches(PRICE_PATTERN)
  price: string;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 30,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  durationMinutes: number;
}
