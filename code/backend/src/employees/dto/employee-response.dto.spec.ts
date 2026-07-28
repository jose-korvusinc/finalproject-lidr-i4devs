import { instanceToPlain, plainToInstance } from 'class-transformer';
import { EmployeeResponseDto } from './employee-response.dto';

const sourceDoc = {
  _id: '665f1b2c9c1e4a0012ab34cd',
  tenantId: '665f1b2c9c1e4a0012abffff',
  name: 'Ada Lovelace',
  email: 'ada@acme.test',
  serviceIds: ['665f1b2c9c1e4a0012ab0001'],
  schemaVersion: 1,
  createdAt: '2026-07-07T09:00:00.000Z',
  updatedAt: '2026-07-07T09:00:00.000Z',
};

function serialize(): Record<string, unknown> {
  const instance = plainToInstance(EmployeeResponseDto, sourceDoc, {
    excludeExtraneousValues: true,
  });
  return instanceToPlain(instance);
}

describe('EmployeeResponseDto', () => {
  it('exposes only the public contract fields', () => {
    const output = serialize();
    expect(Object.keys(output).sort()).toEqual(
      ['id', 'name', 'email', 'serviceIds'].sort(),
    );
  });

  it('maps the identity to id and keeps the public values', () => {
    const output = serialize();
    expect(output.id).toBe('665f1b2c9c1e4a0012ab34cd');
    expect(output.name).toBe('Ada Lovelace');
    expect(output.email).toBe('ada@acme.test');
    expect(output.serviceIds).toEqual(['665f1b2c9c1e4a0012ab0001']);
  });

  it.each(['_id', 'tenantId', 'schemaVersion', 'createdAt', 'updatedAt'])(
    'does not expose the internal field %s',
    (field) => {
      const output = serialize();
      expect(output).not.toHaveProperty(field);
    },
  );
});
