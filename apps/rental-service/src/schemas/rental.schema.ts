import { RentalStatus } from '@app/database/types';
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
    type: String,
    enum: Object.values(RentalStatus),
    default: RentalStatus.ACTIVE,
  })
  status: RentalStatus;

  @Prop({ required: true })
  pickupLocation: string;

  @Prop({ required: true })
  returnLocation: string;

  @Prop({ type: [{ type: Object }] })
  penalties: {
    type: string;
    amount: number;
    description: string;
    isPaid: boolean;
    createdAt: Date;
  }[];

  @Prop({ type: Object })
  invoice: {
    amount: number;
    status: string;
    dueDate: Date;
    paidAt: Date;
  };
}

export const RentalSchema = SchemaFactory.createForClass(Rental);
