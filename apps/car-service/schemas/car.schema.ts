import { CarType, MaintenanceStatus, CarStatus } from '@app/database/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { countries } from 'countries-list';
import { Document } from 'mongoose';

const VALID_COUNTRIES = Object.keys(countries).map(
  (code) => countries[code].name,
);

@Schema({ timestamps: true })
export class Car extends Document {
  @Prop({ required: true, type: String, index: true })
  carModel: string;

  @Prop({ required: true, type: String, index: true })
  brand: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(CarType),
  })
  type: CarType;

  @Prop({ required: true, type: Number, index: true })
  basePrice: number;

  @Prop({ required: true, type: Number, index: true })
  currentPrice: number;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(CarStatus),
    default: CarStatus.AVAILABLE,
    index: true,
  })
  status: CarStatus;

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
    index: true,
  })
  location: string;
}

export const carSchema = SchemaFactory.createForClass(Car);
