import mongoose from 'mongoose';
import { BusinessSchema, TenantStatus } from './business.schema';

interface BusinessDoc {
  name?: string;
  subdomain?: string;
  status?: string;
  owner?: { name?: string; email?: string };
  schemaVersion?: number;
}

function buildModel(): mongoose.Model<BusinessDoc> {
  return (
    (mongoose.models.Business as mongoose.Model<BusinessDoc> | undefined) ??
    mongoose.model<BusinessDoc>('Business', BusinessSchema)
  );
}

function validate(
  doc: BusinessDoc,
): mongoose.Error.ValidationError | undefined {
  const Model = buildModel();
  return new Model(doc).validateSync();
}

const validBusiness: BusinessDoc = {
  name: 'Acme Studio',
  subdomain: 'acme',
  status: 'active',
  owner: { name: 'Ada Lovelace', email: 'ada@acme.test' },
  schemaVersion: 1,
};

describe('Business schema', () => {
  it('exposes the TenantStatus enum with active and suspended', () => {
    expect(Object.values(TenantStatus)).toEqual(
      expect.arrayContaining(['active', 'suspended']),
    );
  });

  it('uses the businesses collection with timestamps enabled', () => {
    expect(BusinessSchema.get('collection')).toBe('businesses');
    expect(BusinessSchema.get('timestamps')).toBe(true);
  });

  it('accepts a fully valid business document', () => {
    expect(validate(validBusiness)).toBeUndefined();
  });

  it('rejects a document without subdomain', () => {
    const doc: BusinessDoc = { ...validBusiness };
    delete doc.subdomain;
    const errors = validate(doc);
    expect(errors?.errors.subdomain).toBeDefined();
  });

  it('rejects a status outside the TenantStatus enum', () => {
    const errors = validate({ ...validBusiness, status: 'foo' });
    expect(errors?.errors.status).toBeDefined();
  });

  it('accepts active and suspended as valid status values', () => {
    expect(validate({ ...validBusiness, status: 'active' })).toBeUndefined();
    expect(validate({ ...validBusiness, status: 'suspended' })).toBeUndefined();
  });

  it('rejects an owner without email', () => {
    const errors = validate({
      ...validBusiness,
      owner: { name: 'Ada Lovelace' },
    });
    expect(errors?.errors['owner.email']).toBeDefined();
  });
});
