import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { SetWeeklyScheduleDto } from './set-weekly-schedule.dto';
import { Weekday } from '../schemas/working-hours.schema';

interface RawSchedulePayload {
  days?: unknown;
  [key: string]: unknown;
}

const validDay = (weekday: Weekday): Record<string, unknown> => ({
  weekday,
  isWorkingDay: true,
  openTime: '09:00',
  closeTime: '18:00',
});

function validatePayload(
  payload: RawSchedulePayload,
): Promise<ValidationError[]> {
  const instance = plainToInstance(SetWeeklyScheduleDto, payload);
  return validate(instance);
}

function hasErrorOn(errors: ValidationError[], property: string): boolean {
  return errors.some((error) => error.property === property);
}

describe('SetWeeklyScheduleDto', () => {
  it('accepts a list of valid working hours for distinct weekdays', async () => {
    const errors = await validatePayload({
      days: [
        validDay(Weekday.MONDAY),
        validDay(Weekday.TUESDAY),
        { weekday: Weekday.SUNDAY, isWorkingDay: false },
      ],
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects the days property when a nested working hour is invalid', async () => {
    const errors = await validatePayload({
      days: [
        validDay(Weekday.MONDAY),
        {
          weekday: Weekday.TUESDAY,
          isWorkingDay: true,
          openTime: '9:00',
          closeTime: '18:00',
        },
      ],
    });
    expect(hasErrorOn(errors, 'days')).toBe(true);
  });

  it('rejects the days property when a nested working hour breaks a range invariant', async () => {
    const errors = await validatePayload({
      days: [
        {
          weekday: Weekday.WEDNESDAY,
          isWorkingDay: true,
          openTime: '18:00',
          closeTime: '09:00',
        },
      ],
    });
    expect(hasErrorOn(errors, 'days')).toBe(true);
  });

  it('rejects duplicated weekdays in the days list', async () => {
    const errors = await validatePayload({
      days: [validDay(Weekday.MONDAY), validDay(Weekday.MONDAY)],
    });
    expect(hasErrorOn(errors, 'days')).toBe(true);
  });
});
