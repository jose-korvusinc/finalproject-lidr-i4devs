import { instanceToPlain, plainToInstance } from 'class-transformer';
import { WeeklyScheduleResponseDto } from './weekly-schedule-response.dto';

const sourceDoc = {
  _id: '665f1b2c9c1e4a0012ab34cd',
  tenantId: '665f1b2c9c1e4a0012ab34cd',
  weekday: 'mon',
  isWorkingDay: true,
  openTime: '09:00',
  closeTime: '18:00',
  breakStart: '13:00',
  breakEnd: '14:00',
  schemaVersion: 1,
  createdAt: '2026-07-07T09:00:00.000Z',
  updatedAt: '2026-07-07T09:00:00.000Z',
};

function serialize(): Record<string, unknown> {
  const instance = plainToInstance(WeeklyScheduleResponseDto, sourceDoc, {
    excludeExtraneousValues: true,
  });
  return instanceToPlain(instance);
}

describe('WeeklyScheduleResponseDto', () => {
  it('exposes only the public contract fields', () => {
    const output = serialize();
    expect(Object.keys(output).sort()).toEqual(
      [
        'weekday',
        'isWorkingDay',
        'openTime',
        'closeTime',
        'breakStart',
        'breakEnd',
      ].sort(),
    );
  });

  it('keeps the public working hour values', () => {
    const output = serialize();
    expect(output.weekday).toBe('mon');
    expect(output.isWorkingDay).toBe(true);
    expect(output.openTime).toBe('09:00');
    expect(output.closeTime).toBe('18:00');
    expect(output.breakStart).toBe('13:00');
    expect(output.breakEnd).toBe('14:00');
  });

  it.each(['_id', 'tenantId', 'schemaVersion', 'createdAt', 'updatedAt'])(
    'does not expose the internal field %s',
    (field) => {
      const output = serialize();
      expect(output).not.toHaveProperty(field);
    },
  );
});
