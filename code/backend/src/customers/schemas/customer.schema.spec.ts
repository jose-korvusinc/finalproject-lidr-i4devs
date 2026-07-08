import mongoose from 'mongoose';
import { CustomerSchema } from './customer.schema';
import { tenantScopePlugin } from '../../tenants/plugins/tenant-scope.plugin';

interface CustomerDoc {
  tenantId?: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  phone?: string;
  schemaVersion?: number;
}

function buildModel(): mongoose.Model<CustomerDoc> {
  return (
    (mongoose.models.Customer as mongoose.Model<CustomerDoc> | undefined) ??
    mongoose.model<CustomerDoc>('Customer', CustomerSchema)
  );
}

function validate(
  doc: CustomerDoc,
): mongoose.Error.ValidationError | undefined {
  const Model = buildModel();
  return new Model(doc).validateSync();
}

const validCustomer: CustomerDoc = {
  tenantId: new mongoose.Types.ObjectId(),
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+34600000000',
  schemaVersion: 1,
};

describe('Customer schema', () => {
  it('uses the customers collection with timestamps enabled', () => {
    expect(CustomerSchema.get('collection')).toBe('customers');
    expect(CustomerSchema.get('timestamps')).toBe(true);
  });

  it('accepts a fully valid customer document', () => {
    expect(validate(validCustomer)).toBeUndefined();
  });

  it('accepts a valid customer document without phone', () => {
    const doc: CustomerDoc = { ...validCustomer };
    delete doc.phone;
    expect(validate(doc)).toBeUndefined();
  });

  it('rejects a document without name', () => {
    const doc: CustomerDoc = { ...validCustomer };
    delete doc.name;
    const errors = validate(doc);
    expect(errors?.errors.name).toBeDefined();
  });

  it('rejects a document without email', () => {
    const doc: CustomerDoc = { ...validCustomer };
    delete doc.email;
    const errors = validate(doc);
    expect(errors?.errors.email).toBeDefined();
  });

  it('registers the tenantScopePlugin on the schema', () => {
    interface RegisteredPlugin {
      fn: (schema: unknown) => void;
    }
    const plugins = CustomerSchema.plugins as RegisteredPlugin[];
    const registered = plugins.map((plugin) => plugin.fn);
    expect(registered).toContain(tenantScopePlugin);
  });
});
