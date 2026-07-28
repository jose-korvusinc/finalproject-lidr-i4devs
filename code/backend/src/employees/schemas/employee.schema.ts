import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { tenantScopePlugin } from '../../tenants/plugins/tenant-scope.plugin';

@Schema({ collection: 'employees', timestamps: true })
export class Employee {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: [SchemaTypes.ObjectId], default: [] })
  serviceIds: Types.ObjectId[];

  @Prop({ type: Number })
  schemaVersion: number;
}

export type EmployeeDocument = HydratedDocument<Employee>;

export const EmployeeSchema = SchemaFactory.createForClass(Employee);

EmployeeSchema.plugin(tenantScopePlugin);
