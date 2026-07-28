import { instanceToPlain, plainToInstance } from 'class-transformer';
import { BookingResponseDto } from './booking-response.dto';

const sourceDoc = {
  _id: '665f1b2c9c1e4a0012ab34cd',
  tenantId: '665f1b2c9c1e4a0012abffff',
  serviceId: '665f1b2c9c1e4a0012ab0001',
  employeeId: '665f1b2c9c1e4a0012ab0002',
  customer: {
    name: 'Ada Lovelace',
    email: 'ada@acme.test',
    phone: '+34600000000',
  },
  status: 'confirmed',
  startsAt: '2026-07-10T09:00:00.000Z',
  schemaVersion: 1,
  createdAt: '2026-07-07T09:00:00.000Z',
  updatedAt: '2026-07-07T09:00:00.000Z',
};

function serialize(): Record<string, unknown> {
  const instance = plainToInstance(BookingResponseDto, sourceDoc, {
    excludeExtraneousValues: true,
  });
  return instanceToPlain(instance);
}

describe('BookingResponseDto', () => {
  it('exposes only the public contract fields', () => {
    const output = serialize();
    expect(Object.keys(output).sort()).toEqual(
      ['id', 'status', 'startsAt'].sort(),
    );
  });

  it('maps the identity to id and keeps the public values', () => {
    const output = serialize();
    expect(output.id).toBe('665f1b2c9c1e4a0012ab34cd');
    expect(output.status).toBe('confirmed');
    expect(output.startsAt).toBe('2026-07-10T09:00:00.000Z');
  });

  it.each([
    '_id',
    'tenantId',
    'serviceId',
    'employeeId',
    'customer',
    'schemaVersion',
    'createdAt',
    'updatedAt',
  ])('does not expose the internal field %s', (field) => {
    const output = serialize();
    expect(output).not.toHaveProperty(field);
  });
});
