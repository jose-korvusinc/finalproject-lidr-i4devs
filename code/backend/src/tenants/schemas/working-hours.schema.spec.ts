import mongoose from 'mongoose';
import { Weekday, WorkingHoursSchema } from './working-hours.schema';
import { tenantScopePlugin } from '../plugins/tenant-scope.plugin';

interface WorkingHoursDoc {
  tenantId?: mongoose.Types.ObjectId;
  weekday?: string;
  isWorkingDay?: boolean;
  openTime?: string;
  closeTime?: string;
  breakStart?: string;
  breakEnd?: string;
  schemaVersion?: number;
}

function buildModel(): mongoose.Model<WorkingHoursDoc> {
  return (
    (mongoose.models.WorkingHours as
      mongoose.Model<WorkingHoursDoc> | undefined) ??
    mongoose.model<WorkingHoursDoc>('WorkingHours', WorkingHoursSchema)
  );
}

function validate(
  doc: WorkingHoursDoc,
): mongoose.Error.ValidationError | undefined {
  const Model = buildModel();
  return new Model(doc).validateSync();
}

const validWorkingHours: WorkingHoursDoc = {
  tenantId: new mongoose.Types.ObjectId(),
  weekday: 'mon',
  isWorkingDay: true,
  openTime: '09:00',
  closeTime: '18:00',
  breakStart: '13:00',
  breakEnd: '14:00',
  schemaVersion: 1,
};

describe('WorkingHours schema', () => {
  it('exposes the Weekday enum with the seven days', () => {
    expect(Object.values(Weekday)).toEqual([
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
      'sat',
      'sun',
    ]);
  });

  it('uses the workingHours collection with timestamps enabled', () => {
    expect(WorkingHoursSchema.get('collection')).toBe('workingHours');
    expect(WorkingHoursSchema.get('timestamps')).toBe(true);
  });

  it('accepts a fully valid working hours document', () => {
    expect(validate(validWorkingHours)).toBeUndefined();
  });

  it('rejects a document without weekday', () => {
    const doc: WorkingHoursDoc = { ...validWorkingHours };
    delete doc.weekday;
    const errors = validate(doc);
    expect(errors?.errors.weekday).toBeDefined();
  });

  it('rejects a weekday outside the Weekday enum', () => {
    const errors = validate({ ...validWorkingHours, weekday: 'funday' });
    expect(errors?.errors.weekday).toBeDefined();
  });

  it('rejects a document without isWorkingDay', () => {
    const doc: WorkingHoursDoc = { ...validWorkingHours };
    delete doc.isWorkingDay;
    const errors = validate(doc);
    expect(errors?.errors.isWorkingDay).toBeDefined();
  });

  it('accepts a valid document without the optional break fields', () => {
    const doc: WorkingHoursDoc = { ...validWorkingHours };
    delete doc.breakStart;
    delete doc.breakEnd;
    expect(validate(doc)).toBeUndefined();
  });

  it('registers the tenantScopePlugin on the schema', () => {
    interface RegisteredPlugin {
      fn: (schema: unknown) => void;
    }
    const plugins = WorkingHoursSchema.plugins as RegisteredPlugin[];
    const registered = plugins.map((plugin) => plugin.fn);
    expect(registered).toContain(tenantScopePlugin);
  });
});
