import { CarType, MaintenanceStatus, Status } from '@app/database/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { countries } from 'countries-list';
import { Document } from 'mongoose';

const VALID_COUNTRIES = Object.keys(countries).map(
  (code) => countries[code].name,
);

@Schema({ timestamps: true })
export class Car extends Document {
  @Prop({ required: true, type: String })
  carModel: string;

  @Prop({ required: true, type: String })
  brand: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(CarType),
  })
  type: CarType;

  @Prop({ required: true, type: Number })
  basePrice: number;

  @Prop({ required: true, type: Number })
  currentPrice: number;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(Status),
    default: Status.AVAILABLE,
  })
  status: Status;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(MaintenanceStatus),
    default: MaintenanceStatus.EXCELLENT,
  })
  maintenanceStatus: MaintenanceStatus;

  @Prop({
    required: true,
    type: String,
    enum: VALID_COUNTRIES,
  })
  location: string;
}

export const carSchema = SchemaFactory.createForClass(Car);
