import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { tenantScopePlugin } from '../../tenants/plugins/tenant-scope.plugin';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Schema({ collection: 'appointments', timestamps: true })
export class Appointment {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  serviceId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  startTime: Date;

  @Prop({ type: Date, required: true })
  endTime: Date;

  @Prop({ type: String, enum: BookingStatus, required: true })
  status: string;

  @Prop({ type: Number })
  schemaVersion: number;
}

export type AppointmentDocument = HydratedDocument<Appointment>;

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.plugin(tenantScopePlugin);
