import { instanceToPlain, plainToInstance } from 'class-transformer';
import { TenantResponseDto } from './tenant-response.dto';

const sourceDoc = {
  _id: '665f1b2c9c1e4a0012ab34cd',
  tenantId: '665f1b2c9c1e4a0012ab34cd',
  name: 'Barberia Paco',
  subdomain: 'barberia-paco',
  status: 'active',
  portalUrl: 'https://barberia-paco.app.test',
  owner: { name: 'Paco', email: 'paco@barberia-paco.test' },
  schemaVersion: 1,
  createdAt: '2026-07-07T09:00:00.000Z',
  updatedAt: '2026-07-07T09:00:00.000Z',
};

function serialize(): Record<string, unknown> {
  const instance = plainToInstance(TenantResponseDto, sourceDoc, {
    excludeExtraneousValues: true,
  });
  return instanceToPlain(instance);
}

describe('TenantResponseDto', () => {
  it('exposes only the public contract fields', () => {
    const output = serialize();
    expect(Object.keys(output).sort()).toEqual(
      ['id', 'name', 'portalUrl', 'status', 'subdomain'].sort(),
    );
  });

  it('maps the identity to id and keeps the public values', () => {
    const output = serialize();
    expect(output.name).toBe('Barberia Paco');
    expect(output.subdomain).toBe('barberia-paco');
    expect(output.status).toBe('active');
    expect(output.portalUrl).toBe('https://barberia-paco.app.test');
  });

  it.each([
    '_id',
    'tenantId',
    'owner',
    'schemaVersion',
    'createdAt',
    'updatedAt',
  ])('does not expose the internal field %s', (field) => {
    const output = serialize();
    expect(output).not.toHaveProperty(field);
  });
});
