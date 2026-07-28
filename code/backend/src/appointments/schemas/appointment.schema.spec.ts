import mongoose from 'mongoose';
import { AppointmentSchema, BookingStatus } from './appointment.schema';
import { tenantScopePlugin } from '../../tenants/plugins/tenant-scope.plugin';

interface AppointmentDoc {
  tenantId?: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  employeeId?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  startTime?: Date;
  endTime?: Date;
  status?: string;
  schemaVersion?: number;
}

function buildModel(): mongoose.Model<AppointmentDoc> {
  return (
    (mongoose.models.Appointment as
      mongoose.Model<AppointmentDoc> | undefined) ??
    mongoose.model<AppointmentDoc>('Appointment', AppointmentSchema)
  );
}

function validate(
  doc: AppointmentDoc,
): mongoose.Error.ValidationError | undefined {
  const Model = buildModel();
  return new Model(doc).validateSync();
}

const validAppointment: AppointmentDoc = {
  tenantId: new mongoose.Types.ObjectId(),
  serviceId: new mongoose.Types.ObjectId(),
  employeeId: new mongoose.Types.ObjectId(),
  customerId: new mongoose.Types.ObjectId(),
  startTime: new Date('2026-07-10T09:00:00Z'),
  endTime: new Date('2026-07-10T09:30:00Z'),
  status: 'confirmed',
  schemaVersion: 1,
};

describe('Appointment schema', () => {
  it('exposes the BookingStatus enum with pending, confirmed and cancelled', () => {
    expect(Object.values(BookingStatus)).toEqual(
      expect.arrayContaining(['pending', 'confirmed', 'cancelled']),
    );
  });

  it('uses the appointments collection with timestamps enabled', () => {
    expect(AppointmentSchema.get('collection')).toBe('appointments');
    expect(AppointmentSchema.get('timestamps')).toBe(true);
  });

  it('accepts a fully valid appointment document', () => {
    expect(validate(validAppointment)).toBeUndefined();
  });

  it('rejects a document without employeeId', () => {
    const doc: AppointmentDoc = { ...validAppointment };
    delete doc.employeeId;
    const errors = validate(doc);
    expect(errors?.errors.employeeId).toBeDefined();
  });

  it('rejects a document without startTime', () => {
    const doc: AppointmentDoc = { ...validAppointment };
    delete doc.startTime;
    const errors = validate(doc);
    expect(errors?.errors.startTime).toBeDefined();
  });

  it('rejects a status outside the BookingStatus enum', () => {
    const errors = validate({ ...validAppointment, status: 'done' });
    expect(errors?.errors.status).toBeDefined();
  });

  it('registers the tenantScopePlugin on the schema', () => {
    interface RegisteredPlugin {
      fn: (schema: unknown) => void;
    }
    const plugins = AppointmentSchema.plugins as RegisteredPlugin[];
    const registered = plugins.map((plugin) => plugin.fn);
    expect(registered).toContain(tenantScopePlugin);
  });
});
