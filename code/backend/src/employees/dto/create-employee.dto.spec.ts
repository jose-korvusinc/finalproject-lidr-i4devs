import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

interface RawEmployeePayload {
  name?: unknown;
  email?: unknown;
  serviceIds?: unknown;
  [key: string]: unknown;
}

const validPayload: RawEmployeePayload = {
  name: 'Ada Lovelace',
  email: 'ada@acme.test',
  serviceIds: ['665f1b2c9c1e4a0012ab34cd'],
};

function validatePayload(
  payload: RawEmployeePayload,
  options?: Parameters<typeof validate>[1],
): Promise<ValidationError[]> {
  const instance = plainToInstance(CreateEmployeeDto, payload);
  return validate(instance, options);
}

function hasErrorOn(errors: ValidationError[], property: string): boolean {
  return errors.some((error) => error.property === property);
}

describe('CreateEmployeeDto', () => {
  it('accepts a fully valid payload', async () => {
    const errors = await validatePayload(validPayload);
    expect(errors).toHaveLength(0);
  });

  describe('name', () => {
    it('rejects a missing name', async () => {
      const payload: RawEmployeePayload = { ...validPayload };
      delete payload.name;
      const errors = await validatePayload(payload);
      expect(hasErrorOn(errors, 'name')).toBe(true);
    });

    it('rejects an empty name', async () => {
      const errors = await validatePayload({ ...validPayload, name: '' });
      expect(hasErrorOn(errors, 'name')).toBe(true);
    });
  });

  describe('email', () => {
    it.each([
      ['a value without an at sign', 'ada-at-acme'],
      ['an empty string', ''],
      ['a plain word', 'notanemail'],
    ])('rejects %s', async (_case, email) => {
      const errors = await validatePayload({ ...validPayload, email });
      expect(hasErrorOn(errors, 'email')).toBe(true);
    });

    it('accepts a well formed email', async () => {
      const errors = await validatePayload({
        ...validPayload,
        email: 'grace@globex.test',
      });
      expect(hasErrorOn(errors, 'email')).toBe(false);
    });
  });

  describe('serviceIds', () => {
    it('rejects an element that is not a mongo id', async () => {
      const errors = await validatePayload({
        ...validPayload,
        serviceIds: ['665f1b2c9c1e4a0012ab34cd', 'not-a-mongo-id'],
      });
      expect(hasErrorOn(errors, 'serviceIds')).toBe(true);
    });

    it('rejects a serviceIds that is not an array', async () => {
      const errors = await validatePayload({
        ...validPayload,
        serviceIds: '665f1b2c9c1e4a0012ab34cd',
      });
      expect(hasErrorOn(errors, 'serviceIds')).toBe(true);
    });

    it('accepts an empty serviceIds array', async () => {
      const errors = await validatePayload({
        ...validPayload,
        serviceIds: [],
      });
      expect(hasErrorOn(errors, 'serviceIds')).toBe(false);
    });

    it('accepts an omitted serviceIds because assignment is optional', async () => {
      const payload: RawEmployeePayload = { ...validPayload };
      delete payload.serviceIds;
      const errors = await validatePayload(payload);
      expect(hasErrorOn(errors, 'serviceIds')).toBe(false);
    });
  });

  describe('whitelist and operator injection', () => {
    const whitelistOptions = { whitelist: true, forbidNonWhitelisted: true };

    it('rejects an undeclared tenantId property because the tenant never comes from the body', async () => {
      const errors = await validatePayload(
        { ...validPayload, tenantId: '665f1b2c9c1e4a0012abffff' },
        whitelistOptions,
      );
      const tenantError = errors.find((error) => error.property === 'tenantId');
      expect(tenantError?.constraints).toHaveProperty('whitelistValidation');
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
