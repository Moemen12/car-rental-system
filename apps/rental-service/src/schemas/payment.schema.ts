import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Rental' })
  rentalId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'usd' })
  currency: string;

  @Prop({ required: true })
  paymentIntentId: string;

  @Prop({ required: true })
  clientSecret: string;

  @Prop({
    required: true,
    enum: ['pending', 'succeeded', 'failed', 'refunded'],
    default: 'pending',
  })
  status: string;

  @Prop()
  refundId?: string;

  @Prop()
  errorMessage?: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  refundedAmount?: number;

  @Prop()
  refundedAt?: Date;

  @Prop({ type: [String] })
  paymentMethodTypes?: string[];
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
