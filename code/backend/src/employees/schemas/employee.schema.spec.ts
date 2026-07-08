import mongoose from 'mongoose';
import { EmployeeSchema } from './employee.schema';
import { tenantScopePlugin } from '../../tenants/plugins/tenant-scope.plugin';

interface EmployeeDoc {
  tenantId?: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  serviceIds?: mongoose.Types.ObjectId[];
  schemaVersion?: number;
}

function buildModel(): mongoose.Model<EmployeeDoc> {
  return (
    (mongoose.models.Employee as mongoose.Model<EmployeeDoc> | undefined) ??
    mongoose.model<EmployeeDoc>('Employee', EmployeeSchema)
  );
}

function validate(
  doc: EmployeeDoc,
): mongoose.Error.ValidationError | undefined {
  const Model = buildModel();
  return new Model(doc).validateSync();
}

const validEmployee: EmployeeDoc = {
  tenantId: new mongoose.Types.ObjectId(),
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  serviceIds: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
  schemaVersion: 1,
};

describe('Employee schema', () => {
  it('uses the employees collection with timestamps enabled', () => {
    expect(EmployeeSchema.get('collection')).toBe('employees');
    expect(EmployeeSchema.get('timestamps')).toBe(true);
  });

  it('accepts a fully valid employee document', () => {
    expect(validate(validEmployee)).toBeUndefined();
  });

  it('accepts an employee without serviceIds', () => {
    const doc: EmployeeDoc = { ...validEmployee };
    delete doc.serviceIds;
    expect(validate(doc)).toBeUndefined();
  });

  it('rejects a document without name', () => {
    const doc: EmployeeDoc = { ...validEmployee };
    delete doc.name;
    const errors = validate(doc);
    expect(errors?.errors.name).toBeDefined();
  });

  it('rejects a document without email', () => {
    const doc: EmployeeDoc = { ...validEmployee };
    delete doc.email;
    const errors = validate(doc);
    expect(errors?.errors.email).toBeDefined();
  });

  it('registers the tenantScopePlugin on the schema', () => {
    interface RegisteredPlugin {
      fn: (schema: unknown) => void;
    }
    const plugins = EmployeeSchema.plugins as RegisteredPlugin[];
    const registered = plugins.map((plugin) => plugin.fn);
    expect(registered).toContain(tenantScopePlugin);
  });
});
