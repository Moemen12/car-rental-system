// rental.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Rental extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Car', required: true })
  carId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  totalCost: number;

  @Prop({
    required: true,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'failed'],
    default: 'pending',
  })
  status: string;
}

export const RentalSchema = SchemaFactory.createForClass(Rental);
