import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { CreateTenantDto } from './create-tenant.dto';

interface RawTenantPayload {
  name?: unknown;
  subdomain?: unknown;
  ownerEmail?: unknown;
  [key: string]: unknown;
}

const validPayload: RawTenantPayload = {
  name: 'Barberia Paco',
  subdomain: 'barberia-paco',
  ownerEmail: 'paco@barberia-paco.test',
};

function validatePayload(
  payload: RawTenantPayload,
  options?: Parameters<typeof validate>[1],
): Promise<ValidationError[]> {
  const instance = plainToInstance(CreateTenantDto, payload);
  return validate(instance, options);
}

function hasErrorOn(errors: ValidationError[], property: string): boolean {
  return errors.some((error) => error.property === property);
}

describe('CreateTenantDto', () => {
  it('accepts a fully valid payload', async () => {
    const errors = await validatePayload(validPayload);
    expect(errors).toHaveLength(0);
  });

  describe('ownerEmail', () => {
    it('rejects a value that is not an email', async () => {
      const errors = await validatePayload({
        ...validPayload,
        ownerEmail: 'not-an-email',
      });
      expect(hasErrorOn(errors, 'ownerEmail')).toBe(true);
    });
  });

  describe('subdomain', () => {
    it.each([
      ['uppercase letters', 'Acme'],
      ['a dot separator', 'ac.me'],
      ['a dollar operator symbol', 'ac$me'],
      ['a whitespace', 'ac me'],
      ['an empty string', ''],
    ])('rejects a subdomain with %s', async (_case, subdomain) => {
      const errors = await validatePayload({ ...validPayload, subdomain });
      expect(hasErrorOn(errors, 'subdomain')).toBe(true);
    });

    it('accepts a slug with hyphens and digits', async () => {
      const errors = await validatePayload({
        ...validPayload,
        subdomain: 'acme-123',
      });
      expect(hasErrorOn(errors, 'subdomain')).toBe(false);
    });

    it.each([['registro'], ['www'], ['api'], ['admin'], ['app']])(
      'rejects the reserved subdomain %s',
      async (subdomain) => {
        const errors = await validatePayload({ ...validPayload, subdomain });
        expect(hasErrorOn(errors, 'subdomain')).toBe(true);
      },
    );

    it('accepts a slug that merely contains a reserved word', async () => {
      const errors = await validatePayload({
        ...validPayload,
        subdomain: 'registro-paco',
      });
      expect(hasErrorOn(errors, 'subdomain')).toBe(false);
    });
  });

  describe('name', () => {
    it('rejects a missing name', async () => {
      const payload: RawTenantPayload = { ...validPayload };
      delete payload.name;
      const errors = await validatePayload(payload);
      expect(hasErrorOn(errors, 'name')).toBe(true);
    });

    it('rejects an empty name', async () => {
      const errors = await validatePayload({ ...validPayload, name: '' });
      expect(hasErrorOn(errors, 'name')).toBe(true);
    });
  });

  describe('whitelist and operator injection', () => {
    const whitelistOptions = { whitelist: true, forbidNonWhitelisted: true };

    it('rejects an undeclared property', async () => {
      const errors = await validatePayload(
        { ...validPayload, role: 'admin' },
        whitelistOptions,
      );
      const roleError = errors.find((error) => error.property === 'role');
      expect(roleError?.constraints).toHaveProperty('whitelistValidation');
    });

    it('rejects an injected mongo operator key', async () => {
      const errors = await validatePayload(
        { ...validPayload, $gt: '' },
        whitelistOptions,
      );
      const operatorError = errors.find((error) => error.property === '$gt');
      expect(operatorError?.constraints).toHaveProperty('whitelistValidation');
    });

    it('drops undeclared properties from the DTO contract when whitelisted', () => {
      const instance = plainToInstance(
        CreateTenantDto,
        { ...validPayload, role: 'admin', $gt: '' },
        { excludeExtraneousValues: true },
      );
      expect(instance).not.toHaveProperty('role');
      expect(instance).not.toHaveProperty('$gt');
    });
  });
});
