import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { WorkingHourDto } from './working-hour.dto';
import { Weekday } from '../schemas/working-hours.schema';

interface RawWorkingHourPayload {
  weekday?: unknown;
  isWorkingDay?: unknown;
  openTime?: unknown;
  closeTime?: unknown;
  breakStart?: unknown;
  breakEnd?: unknown;
  [key: string]: unknown;
}

const validWorkingDay: RawWorkingHourPayload = {
  weekday: Weekday.MONDAY,
  isWorkingDay: true,
  openTime: '09:00',
  closeTime: '18:00',
};

function validatePayload(
  payload: RawWorkingHourPayload,
): Promise<ValidationError[]> {
  const instance = plainToInstance(WorkingHourDto, payload);
  return validate(instance);
}

function hasErrorOn(errors: ValidationError[], property: string): boolean {
  return errors.some((error) => error.property === property);
}

describe('WorkingHourDto', () => {
  it('accepts a valid working day without a break', async () => {
    const errors = await validatePayload(validWorkingDay);
    expect(errors).toHaveLength(0);
  });

  it('accepts a valid working day with a break inside the range', async () => {
    const errors = await validatePayload({
      ...validWorkingDay,
      breakStart: '13:00',
      breakEnd: '14:00',
    });
    expect(errors).toHaveLength(0);
  });

  it('accepts a non-working day without open and close times', async () => {
    const errors = await validatePayload({
      weekday: Weekday.SUNDAY,
      isWorkingDay: false,
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects a weekday outside the enum', async () => {
    const errors = await validatePayload({
      ...validWorkingDay,
      weekday: 'funday',
    });
    expect(hasErrorOn(errors, 'weekday')).toBe(true);
  });

  it('rejects a non-boolean isWorkingDay', async () => {
    const errors = await validatePayload({
      ...validWorkingDay,
      isWorkingDay: 'yes',
    });
    expect(hasErrorOn(errors, 'isWorkingDay')).toBe(true);
  });

  describe('time format', () => {
    it.each([
      ['a single digit hour', '9:00'],
      ['an hour out of range', '25:00'],
      ['a missing separator', '0900'],
      ['minutes out of range', '09:60'],
      ['a plain word', 'morning'],
    ])(
      'rejects an openTime with %s on a working day',
      async (_case, openTime) => {
        const errors = await validatePayload({ ...validWorkingDay, openTime });
        expect(hasErrorOn(errors, 'openTime')).toBe(true);
      },
    );

    it.each([
      ['a single digit hour', '9:00'],
      ['an hour out of range', '24:00'],
      ['a missing separator', '1800'],
    ])(
      'rejects a closeTime with %s on a working day',
      async (_case, closeTime) => {
        const errors = await validatePayload({ ...validWorkingDay, closeTime });
        expect(hasErrorOn(errors, 'closeTime')).toBe(true);
      },
    );

    it('rejects a breakStart with an invalid format when present', async () => {
      const errors = await validatePayload({
        ...validWorkingDay,
        breakStart: '1:5',
        breakEnd: '14:00',
      });
      expect(hasErrorOn(errors, 'breakStart')).toBe(true);
    });

    it('rejects an empty break string: absent means omitted, not ""', async () => {
      const errors = await validatePayload({
        ...validWorkingDay,
        breakStart: '',
        breakEnd: '',
      });
      expect(hasErrorOn(errors, 'breakStart')).toBe(true);
      expect(hasErrorOn(errors, 'breakEnd')).toBe(true);
    });
  });

  describe('range invariants', () => {
    it('rejects an openTime later than the closeTime', async () => {
      const errors = await validatePayload({
        ...validWorkingDay,
        openTime: '18:00',
        closeTime: '09:00',
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects an openTime equal to the closeTime', async () => {
      const errors = await validatePayload({
        ...validWorkingDay,
        openTime: '09:00',
        closeTime: '09:00',
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a breakStart earlier than the openTime', async () => {
      const errors = await validatePayload({
        ...validWorkingDay,
        breakStart: '08:00',
        breakEnd: '10:00',
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a breakEnd later than the closeTime', async () => {
      const errors = await validatePayload({
        ...validWorkingDay,
        breakStart: '17:00',
        breakEnd: '19:00',
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a breakStart equal to or later than the breakEnd', async () => {
      const errors = await validatePayload({
        ...validWorkingDay,
        breakStart: '14:00',
        breakEnd: '13:00',
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a break with only the start defined', async () => {
      const errors = await validatePayload({
        ...validWorkingDay,
        breakStart: '13:00',
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a break with only the end defined', async () => {
      const errors = await validatePayload({
        ...validWorkingDay,
        breakEnd: '14:00',
      });
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
