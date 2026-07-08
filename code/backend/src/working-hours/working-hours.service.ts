import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';
import { WeeklyScheduleResponseDto } from '../tenants/dto/weekly-schedule-response.dto';
import {
  Weekday,
  WorkingHours,
  WorkingHoursDocument,
} from '../tenants/schemas/working-hours.schema';

const weekdayOrder = Object.values(Weekday);

@Injectable()
export class WorkingHoursService {
  constructor(
    @InjectModel(WorkingHours.name)
    private readonly workingHoursModel: Model<WorkingHoursDocument>,
  ) {}

  async list(): Promise<WeeklyScheduleResponseDto[]> {
    const rules = await this.workingHoursModel.find({}).lean<WorkingHours[]>();

    return rules
      .sort(
        (a, b) =>
          weekdayOrder.indexOf(a.weekday as Weekday) -
          weekdayOrder.indexOf(b.weekday as Weekday),
      )
      .map((rule) =>
        plainToInstance(WeeklyScheduleResponseDto, rule, {
          excludeExtraneousValues: true,
        }),
      );
  }
}
