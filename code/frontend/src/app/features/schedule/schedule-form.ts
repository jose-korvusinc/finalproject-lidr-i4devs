import { Component, computed, input, linkedSignal, output } from '@angular/core';
import {
  applyEach,
  applyWhen,
  form,
  FormField,
  pattern,
  required,
  validate,
} from '@angular/forms/signals';
import { WeeklyScheduleDay } from './schedule.api';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

interface ScheduleDayModel {
  weekday: string;
  isWorkingDay: boolean;
  openTime: string;
  closeTime: string;
  breakStart: string;
  breakEnd: string;
}

function toModel(seed: WeeklyScheduleDay[] | undefined): ScheduleDayModel[] {
  return WEEKDAYS.map((weekday) => {
    const day = seed?.find((item) => item.weekday === weekday);
    return {
      weekday,
      isWorkingDay: day?.isWorkingDay ?? false,
      openTime: day?.openTime ?? '',
      closeTime: day?.closeTime ?? '',
      breakStart: day?.breakStart ?? '',
      breakEnd: day?.breakEnd ?? '',
    };
  });
}

function minutes(value: string): number {
  const [hours, mins] = value.split(':');
  return Number(hours) * 60 + Number(mins);
}

@Component({
  selector: 'app-schedule-form',
  imports: [FormField],
  templateUrl: './schedule-form.html',
  styleUrl: './schedule-form.scss',
})
export class ScheduleForm {
  readonly initialSchedule = input<WeeklyScheduleDay[]>();

  readonly model = linkedSignal<ScheduleDayModel[]>(() => toModel(this.initialSchedule()));

  readonly form = form(this.model, (path) => {
    applyEach(path, (day) => {
      applyWhen(
        day,
        (ctx) => ctx.value().isWorkingDay,
        (workingDay) => {
          required(workingDay.openTime);
          pattern(workingDay.openTime, TIME_PATTERN);
          required(workingDay.closeTime);
          pattern(workingDay.closeTime, TIME_PATTERN);
          validate(workingDay.closeTime, (ctx) => {
            const open = ctx.valueOf(workingDay.openTime);
            const close = ctx.value();
            if (
              TIME_PATTERN.test(open) &&
              TIME_PATTERN.test(close) &&
              minutes(open) >= minutes(close)
            ) {
              return { kind: 'timeOrder' };
            }
            return null;
          });
          validate(workingDay.breakEnd, (ctx) => {
            const start = ctx.valueOf(workingDay.breakStart);
            const end = ctx.value();
            if (start === '' && end === '') {
              return null;
            }
            const open = ctx.valueOf(workingDay.openTime);
            const close = ctx.valueOf(workingDay.closeTime);
            const allValid =
              TIME_PATTERN.test(start) &&
              TIME_PATTERN.test(end) &&
              TIME_PATTERN.test(open) &&
              TIME_PATTERN.test(close);
            if (!allValid) {
              return { kind: 'breakRange' };
            }
            const withinHours =
              minutes(open) <= minutes(start) &&
              minutes(start) < minutes(end) &&
              minutes(end) <= minutes(close);
            return withinHours ? null : { kind: 'breakRange' };
          });
        },
      );
    });
  });

  readonly saveDisabled = computed<boolean>(() => this.form().invalid());

  readonly save = output<WeeklyScheduleDay[]>();

  onSave(): void {
    if (this.form().invalid()) {
      return;
    }
    this.save.emit(this.model());
  }
}
