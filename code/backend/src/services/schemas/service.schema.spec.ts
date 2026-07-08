import mongoose from 'mongoose';
import { ServiceSchema } from './service.schema';
import { tenantScopePlugin } from '../../tenants/plugins/tenant-scope.plugin';

interface ServiceDoc {
  tenantId?: mongoose.Types.ObjectId;
  name?: string;
  price?: mongoose.Types.Decimal128;
  durationMinutes?: number;
  active?: boolean;
  schemaVersion?: number;
}

function buildModel(): mongoose.Model<ServiceDoc> {
  return (
    (mongoose.models.Service as mongoose.Model<ServiceDoc> | undefined) ??
    mongoose.model<ServiceDoc>('Service', ServiceSchema)
  );
}

function validate(doc: ServiceDoc): mongoose.Error.ValidationError | undefined {
  const Model = buildModel();
  return new Model(doc).validateSync();
}

const validService: ServiceDoc = {
  tenantId: new mongoose.Types.ObjectId(),
  name: 'Haircut',
  price: mongoose.Types.Decimal128.fromString('25.00'),
  durationMinutes: 30,
  active: true,
  schemaVersion: 1,
};

describe('Service schema', () => {
  it('uses the services collection with timestamps enabled', () => {
    expect(ServiceSchema.get('collection')).toBe('services');
    expect(ServiceSchema.get('timestamps')).toBe(true);
  });

  it('accepts a fully valid service document', () => {
    expect(validate(validService)).toBeUndefined();
  });

  it('rejects a document without name', () => {
    const doc: ServiceDoc = { ...validService };
    delete doc.name;
    const errors = validate(doc);
    expect(errors?.errors.name).toBeDefined();
  });

  it('rejects a document without price', () => {
    const doc: ServiceDoc = { ...validService };
    delete doc.price;
    const errors = validate(doc);
    expect(errors?.errors.price).toBeDefined();
  });

  it('rejects a document without durationMinutes', () => {
    const doc: ServiceDoc = { ...validService };
    delete doc.durationMinutes;
    const errors = validate(doc);
    expect(errors?.errors.durationMinutes).toBeDefined();
  });

  it('rejects a document without active', () => {
    const doc: ServiceDoc = { ...validService };
    delete doc.active;
    const errors = validate(doc);
    expect(errors?.errors.active).toBeDefined();
  });

  it('registers the tenantScopePlugin on the schema', () => {
    interface RegisteredPlugin {
      fn: (schema: unknown) => void;
    }
    const plugins = ServiceSchema.plugins as RegisteredPlugin[];
    const registered = plugins.map((plugin) => plugin.fn);
    expect(registered).toContain(tenantScopePlugin);
  });
});
