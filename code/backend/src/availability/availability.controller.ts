import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { AvailabilityService } from './availability.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { AvailabilitySlotDto } from './dto/availability-slot.dto';

@ApiTags('availability')
@Controller({ path: 'availability', version: '1' })
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Get()
  @ApiOperation({
    summary: 'List available booking slots for a service and employee on a day',
  })
  @ApiOkResponse({ type: AvailabilitySlotDto, isArray: true })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiForbiddenResponse({ description: 'Tenant context could not be resolved' })
  async list(
    @Query() query: AvailabilityQueryDto,
  ): Promise<AvailabilitySlotDto[]> {
    const slots = await this.availability.computeSlots(query);
    return slots.map((slot) =>
      plainToInstance(
        AvailabilitySlotDto,
        {
          startsAt: slot.startsAt.toISOString(),
          endsAt: slot.endsAt.toISOString(),
        },
        { excludeExtraneousValues: true },
      ),
    );
  }
}
