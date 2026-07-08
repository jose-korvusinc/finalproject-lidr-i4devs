import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { tenantScopePlugin } from '../plugins/tenant-scope.plugin';

export enum Weekday {
  MONDAY = 'mon',
  TUESDAY = 'tue',
  WEDNESDAY = 'wed',
  THURSDAY = 'thu',
  FRIDAY = 'fri',
  SATURDAY = 'sat',
  SUNDAY = 'sun',
}

@Schema({ collection: 'workingHours', timestamps: true })
export class WorkingHours {
  @Prop({ type: Types.ObjectId, required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: String, enum: Weekday, required: true })
  weekday: string;

  @Prop({ type: Boolean, required: true })
  isWorkingDay: boolean;

  @Prop({ type: String })
  openTime: string;

  @Prop({ type: String })
  closeTime: string;

  @Prop({ type: String })
  breakStart?: string;

  @Prop({ type: String })
  breakEnd?: string;

  @Prop({ type: Number })
  schemaVersion: number;
}

export type WorkingHoursDocument = HydratedDocument<WorkingHours>;

export const WorkingHoursSchema = SchemaFactory.createForClass(WorkingHours);

WorkingHoursSchema.plugin(tenantScopePlugin);
