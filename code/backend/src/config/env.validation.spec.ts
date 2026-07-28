import { validateEnv } from './env.validation';

const validEnv = {
  MONGODB_URI: 'mongodb://localhost:27017/bookings',
  TENANT_BASE_DOMAIN: 'jpasoftware.com',
};

describe('validateEnv', () => {
  it('returns the environment when every required variable is present', () => {
    expect(validateEnv(validEnv)).toEqual(validEnv);
  });

  it('keeps optional variables untouched', () => {
    const env = { ...validEnv, MONGODB_DB: 'bookings', PORT: '3000' };

    expect(validateEnv(env)).toEqual(env);
  });

  it('rejects a missing TENANT_BASE_DOMAIN', () => {
    expect(() => validateEnv({ MONGODB_URI: validEnv.MONGODB_URI })).toThrow(
      'TENANT_BASE_DOMAIN',
    );
  });

  it('rejects a blank TENANT_BASE_DOMAIN', () => {
    expect(() =>
      validateEnv({ ...validEnv, TENANT_BASE_DOMAIN: '   ' }),
    ).toThrow('TENANT_BASE_DOMAIN');
  });

  it('rejects a missing MONGODB_URI', () => {
    expect(() =>
      validateEnv({ TENANT_BASE_DOMAIN: validEnv.TENANT_BASE_DOMAIN }),
    ).toThrow('MONGODB_URI');
  });

  it('reports every missing variable in a single error', () => {
    expect(() => validateEnv({})).toThrow(/MONGODB_URI.*TENANT_BASE_DOMAIN/s);
  });
});
