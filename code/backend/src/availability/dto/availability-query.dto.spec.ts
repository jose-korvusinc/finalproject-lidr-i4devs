import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { AvailabilityQueryDto } from './availability-query.dto';

interface RawAvailabilityQuery {
  serviceId?: unknown;
  employeeId?: unknown;
  date?: unknown;
  [key: string]: unknown;
}

const validQuery: RawAvailabilityQuery = {
  serviceId: '665f1b2c9c1e4a0012ab0001',
  employeeId: '665f1b2c9c1e4a0012ab0002',
  date: '2026-07-10',
};

function validateQuery(
  payload: RawAvailabilityQuery,
  options?: Parameters<typeof validate>[1],
): Promise<ValidationError[]> {
  const instance = plainToInstance(AvailabilityQueryDto, payload);
  return validate(instance, options);
}

function hasErrorOn(errors: ValidationError[], property: string): boolean {
  return errors.some((error) => error.property === property);
}

describe('AvailabilityQueryDto', () => {
  it('accepts a fully valid query', async () => {
    const errors = await validateQuery(validQuery);
    expect(errors).toHaveLength(0);
  });

  describe('serviceId', () => {
    it('rejects a serviceId that is not a mongo id', async () => {
      const errors = await validateQuery({
        ...validQuery,
        serviceId: 'not-a-mongo-id',
      });
      expect(hasErrorOn(errors, 'serviceId')).toBe(true);
    });
  });

  describe('employeeId', () => {
    it('rejects a missing employeeId', async () => {
      const payload: RawAvailabilityQuery = { ...validQuery };
      delete payload.employeeId;
      const errors = await validateQuery(payload);
      expect(hasErrorOn(errors, 'employeeId')).toBe(true);
    });

    it('rejects an employeeId that is not a mongo id', async () => {
      const errors = await validateQuery({
        ...validQuery,
        employeeId: '123',
      });
      expect(hasErrorOn(errors, 'employeeId')).toBe(true);
    });
  });

  describe('date', () => {
    it('rejects a date that is not an ISO 8601 value', async () => {
      const errors = await validateQuery({
        ...validQuery,
        date: '10-07-2026',
      });
      expect(hasErrorOn(errors, 'date')).toBe(true);
    });

    it('rejects a missing date', async () => {
      const payload: RawAvailabilityQuery = { ...validQuery };
      delete payload.date;
      const errors = await validateQuery(payload);
      expect(hasErrorOn(errors, 'date')).toBe(true);
    });
  });

  describe('whitelist and operator injection', () => {
    const whitelistOptions = { whitelist: true, forbidNonWhitelisted: true };

    it('rejects an undeclared property', async () => {
      const errors = await validateQuery(
        { ...validQuery, role: 'admin' },
        whitelistOptions,
      );
      const roleError = errors.find((error) => error.property === 'role');
      expect(roleError?.constraints).toHaveProperty('whitelistValidation');
    });

    it('rejects an injected mongo operator key', async () => {
      const errors = await validateQuery(
        { ...validQuery, $gt: '' },
        whitelistOptions,
      );
      const operatorError = errors.find((error) => error.property === '$gt');
      expect(operatorError?.constraints).toHaveProperty('whitelistValidation');
    });
  });
});
