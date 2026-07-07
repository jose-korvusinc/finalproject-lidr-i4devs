import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

@Schema({ _id: false })
export class BusinessOwner {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  email: string;
}

export const BusinessOwnerSchema = SchemaFactory.createForClass(BusinessOwner);

@Schema({ collection: 'businesses', timestamps: true })
export class Business {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  subdomain: string;

  @Prop({
    type: String,
    enum: TenantStatus,
    required: true,
    default: TenantStatus.ACTIVE,
  })
  status: string;

  @Prop({ type: BusinessOwnerSchema, required: true })
  owner: BusinessOwner;

  @Prop({ type: Number })
  schemaVersion: number;
}

export type BusinessDocument = HydratedDocument<Business>;

export const BusinessSchema = SchemaFactory.createForClass(Business);
