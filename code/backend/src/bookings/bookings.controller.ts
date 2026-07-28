import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { BookingResponseDto } from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('bookings')
@Controller({ path: 'bookings', version: '1' })
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a booking for the current tenant' })
  @ApiCreatedResponse({ type: BookingResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed or the service or employee does not exist',
  })
  @ApiConflictResponse({ description: 'The slot is already booked' })
  @ApiForbiddenResponse({ description: 'Tenant context could not be resolved' })
  create(@Body() dto: CreateBookingDto): Promise<BookingResponseDto> {
    return this.bookings.create(dto);
  }
}
