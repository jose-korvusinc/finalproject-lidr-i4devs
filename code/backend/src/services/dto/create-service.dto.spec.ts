import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { CreateServiceDto } from './create-service.dto';

interface RawServicePayload {
  name?: unknown;
  price?: unknown;
  durationMinutes?: unknown;
  [key: string]: unknown;
}

const validPayload: RawServicePayload = {
  name: 'Haircut',
  price: '25.00',
  durationMinutes: 30,
};

function validatePayload(
  payload: RawServicePayload,
  options?: Parameters<typeof validate>[1],
): Promise<ValidationError[]> {
  const instance = plainToInstance(CreateServiceDto, payload);
  return validate(instance, options);
}

function hasErrorOn(errors: ValidationError[], property: string): boolean {
  return errors.some((error) => error.property === property);
}

describe('CreateServiceDto', () => {
  it('accepts a fully valid payload', async () => {
    const errors = await validatePayload(validPayload);
    expect(errors).toHaveLength(0);
  });

  describe('name', () => {
    it('rejects a missing name', async () => {
      const payload: RawServicePayload = { ...validPayload };
      delete payload.name;
      const errors = await validatePayload(payload);
      expect(hasErrorOn(errors, 'name')).toBe(true);
    });

    it('rejects an empty name', async () => {
      const errors = await validatePayload({ ...validPayload, name: '' });
      expect(hasErrorOn(errors, 'name')).toBe(true);
    });
  });

  describe('durationMinutes', () => {
    it.each([
      ['a non-integer value', 30.5],
      ['zero', 0],
      ['a negative value', -15],
    ])('rejects %s', async (_case, durationMinutes) => {
      const errors = await validatePayload({
        ...validPayload,
        durationMinutes,
      });
      expect(hasErrorOn(errors, 'durationMinutes')).toBe(true);
    });

    it('accepts a positive integer duration', async () => {
      const errors = await validatePayload({
        ...validPayload,
        durationMinutes: 45,
      });
      expect(hasErrorOn(errors, 'durationMinutes')).toBe(false);
    });
  });

  describe('price', () => {
    it.each([
      ['a non-numeric string', 'abc'],
      ['an empty string', ''],
      ['more than two decimals', '25.999'],
      ['a negative amount', '-5.00'],
    ])('rejects %s', async (_case, price) => {
      const errors = await validatePayload({ ...validPayload, price });
      expect(hasErrorOn(errors, 'price')).toBe(true);
    });

    it.each([
      ['an integer amount', '25'],
      ['one decimal', '25.5'],
      ['two decimals', '25.00'],
    ])('accepts %s', async (_case, price) => {
      const errors = await validatePayload({ ...validPayload, price });
      expect(hasErrorOn(errors, 'price')).toBe(false);
    });
  });

  describe('whitelist and operator injection', () => {
    const whitelistOptions = { whitelist: true, forbidNonWhitelisted: true };

    it('rejects an undeclared tenantId property because the tenant never comes from the body', async () => {
      const errors = await validatePayload(
        { ...validPayload, tenantId: '665f1b2c9c1e4a0012ab34cd' },
        whitelistOptions,
      );
      const tenantError = errors.find((error) => error.property === 'tenantId');
      expect(tenantError?.constraints).toHaveProperty('whitelistValidation');
    });

    it('rejects an undeclared active property because activation is not client controlled', async () => {
      const errors = await validatePayload(
        { ...validPayload, active: false },
        whitelistOptions,
      );
      const activeError = errors.find((error) => error.property === 'active');
      expect(activeError?.constraints).toHaveProperty('whitelistValidation');
    });

    it('rejects an injected mongo operator key', async () => {
      const errors = await validatePayload(
        { ...validPayload, $gt: '' },
        whitelistOptions,
      );
      const operatorError = errors.find((error) => error.property === '$gt');
      expect(operatorError?.constraints).toHaveProperty('whitelistValidation');
    });
  });
});
