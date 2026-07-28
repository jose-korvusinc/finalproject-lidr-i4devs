import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { tenantScopePlugin } from '../../tenants/plugins/tenant-scope.plugin';

@Schema({ collection: 'customers', timestamps: true })
export class Customer {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: Number })
  schemaVersion: number;
}

export type CustomerDocument = HydratedDocument<Customer>;

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.plugin(tenantScopePlugin);
