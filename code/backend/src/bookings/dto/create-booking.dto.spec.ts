import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { CreateBookingDto } from './create-booking.dto';

interface RawCustomerPayload {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  [key: string]: unknown;
}

interface RawBookingPayload {
  serviceId?: unknown;
  employeeId?: unknown;
  startsAt?: unknown;
  customer?: RawCustomerPayload;
  [key: string]: unknown;
}

const validCustomer: RawCustomerPayload = {
  name: 'Ada Lovelace',
  email: 'ada@acme.test',
  phone: '+34600000000',
};

const validPayload: RawBookingPayload = {
  serviceId: '665f1b2c9c1e4a0012ab0001',
  employeeId: '665f1b2c9c1e4a0012ab0002',
  startsAt: '2026-07-10T09:00:00.000Z',
  customer: validCustomer,
};

function validatePayload(
  payload: RawBookingPayload,
  options?: Parameters<typeof validate>[1],
): Promise<ValidationError[]> {
  const instance = plainToInstance(CreateBookingDto, payload);
  return validate(instance, options);
}

function hasErrorOn(errors: ValidationError[], property: string): boolean {
  return errors.some((error) => error.property === property);
}

function nestedHasErrorOn(
  errors: ValidationError[],
  parent: string,
  child: string,
): boolean {
  const parentError = errors.find((error) => error.property === parent);
  return Boolean(
    parentError?.children?.some((error) => error.property === child),
  );
}

describe('CreateBookingDto', () => {
  it('accepts a fully valid payload', async () => {
    const errors = await validatePayload(validPayload);
    expect(errors).toHaveLength(0);
  });

  describe('serviceId', () => {
    it('rejects a value that is not a mongo id', async () => {
      const errors = await validatePayload({
        ...validPayload,
        serviceId: 'not-a-mongo-id',
      });
      expect(hasErrorOn(errors, 'serviceId')).toBe(true);
    });
  });

  describe('employeeId', () => {
    it('rejects a value that is not a mongo id', async () => {
      const errors = await validatePayload({
        ...validPayload,
        employeeId: '12345',
      });
      expect(hasErrorOn(errors, 'employeeId')).toBe(true);
    });
  });

  describe('startsAt', () => {
    it.each([
      ['a plain date without time', '2026-07-10'],
      ['a non-date string', 'not-a-date'],
      ['an empty string', ''],
    ])('rejects %s', async (_case, startsAt) => {
      const errors = await validatePayload({ ...validPayload, startsAt });
      expect(hasErrorOn(errors, 'startsAt')).toBe(true);
    });
  });

  describe('customer', () => {
    it('rejects an invalid email propagated from the nested contact', async () => {
      const errors = await validatePayload({
        ...validPayload,
        customer: { ...validCustomer, email: 'not-an-email' },
      });
      expect(nestedHasErrorOn(errors, 'customer', 'email')).toBe(true);
    });

    it('rejects an empty contact name', async () => {
      const errors = await validatePayload({
        ...validPayload,
        customer: { ...validCustomer, name: '' },
      });
      expect(nestedHasErrorOn(errors, 'customer', 'name')).toBe(true);
    });

    it.each([
      ['non-numeric text', 'abc'],
      ['an empty string', ''],
    ])('rejects a phone with %s', async (_case, phone) => {
      const errors = await validatePayload({
        ...validPayload,
        customer: { ...validCustomer, phone },
      });
      expect(nestedHasErrorOn(errors, 'customer', 'phone')).toBe(true);
    });

    it.each([
      ['an international prefix', '+34600000000'],
      ['spaces and hyphens', '600 00-00-00'],
    ])('accepts a phone with %s', async (_case, phone) => {
      const errors = await validatePayload({
        ...validPayload,
        customer: { ...validCustomer, phone },
      });
      expect(nestedHasErrorOn(errors, 'customer', 'phone')).toBe(false);
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
