import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';
import { SetWeeklyScheduleDto } from '../tenants/dto/set-weekly-schedule.dto';
import { WeeklyScheduleResponseDto } from '../tenants/dto/weekly-schedule-response.dto';
import { WorkingHourDto } from '../tenants/dto/working-hour.dto';
import {
  Weekday,
  WorkingHours,
  WorkingHoursDocument,
} from '../tenants/schemas/working-hours.schema';

const weekdayOrder = Object.values(Weekday);
const SCHEMA_VERSION = 1;

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

  async save(dto: SetWeeklyScheduleDto): Promise<WeeklyScheduleResponseDto[]> {
    await Promise.all(
      dto.days.map((day) => {
        const update: Omit<WorkingHourDto, 'weekday'> = {
          isWorkingDay: day.isWorkingDay,
          openTime: day.openTime,
          closeTime: day.closeTime,
          breakStart: day.breakStart,
          breakEnd: day.breakEnd,
        };

        return this.workingHoursModel.updateOne(
          { weekday: day.weekday },
          { $set: update, $setOnInsert: { schemaVersion: SCHEMA_VERSION } },
          { upsert: true },
        );
      }),
    );

    return this.list();
  }
}
