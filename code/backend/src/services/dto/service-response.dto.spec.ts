import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ServiceResponseDto } from './service-response.dto';

const sourceDoc = {
  _id: '665f1b2c9c1e4a0012ab34cd',
  tenantId: '665f1b2c9c1e4a0012abffff',
  name: 'Haircut',
  price: '25.00',
  durationMinutes: 30,
  active: true,
  schemaVersion: 1,
  createdAt: '2026-07-07T09:00:00.000Z',
  updatedAt: '2026-07-07T09:00:00.000Z',
};

function serialize(): Record<string, unknown> {
  const instance = plainToInstance(ServiceResponseDto, sourceDoc, {
    excludeExtraneousValues: true,
  });
  return instanceToPlain(instance);
}

describe('ServiceResponseDto', () => {
  it('exposes only the public contract fields', () => {
    const output = serialize();
    expect(Object.keys(output).sort()).toEqual(
      ['id', 'name', 'price', 'durationMinutes', 'active'].sort(),
    );
  });

  it('maps the identity to id and keeps the public values', () => {
    const output = serialize();
    expect(output.id).toBe('665f1b2c9c1e4a0012ab34cd');
    expect(output.name).toBe('Haircut');
    expect(output.price).toBe('25.00');
    expect(output.durationMinutes).toBe(30);
    expect(output.active).toBe(true);
  });

  it.each(['_id', 'tenantId', 'schemaVersion', 'createdAt', 'updatedAt'])(
    'does not expose the internal field %s',
    (field) => {
      const output = serialize();
      expect(output).not.toHaveProperty(field);
    },
  );
});
