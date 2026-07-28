import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { tenantScopePlugin } from '../../tenants/plugins/tenant-scope.plugin';

@Schema({ collection: 'services', timestamps: true })
export class Service {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: SchemaTypes.Decimal128, required: true })
  price: Types.Decimal128;

  @Prop({ type: Number, required: true })
  durationMinutes: number;

  @Prop({ type: Boolean, required: true })
  active: boolean;

  @Prop({ type: Number })
  schemaVersion: number;
}

export type ServiceDocument = HydratedDocument<Service>;

export const ServiceSchema = SchemaFactory.createForClass(Service);

ServiceSchema.plugin(tenantScopePlugin);
