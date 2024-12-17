import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ROLE } from '../../../../libs/database/src/types';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({ type: String, required: true })
  fullName: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, required: true, enum: ROLE, default: ROLE.CUSTOMER })
  role: string;

  @Prop({ type: String, default: '' })
  driverLicenseId: string;

  @Prop({ type: String, default: '' })
  driverLicenseImageUrl: string;

  // @Prop({
  //   type: Object,
  //   default: {},
  // })
  // profile: {
  //   address?: string;
  //   preferredPaymentMethod?: string;
  //   documents?: Record<string, any>;
  //   phoneNumber?: string;
  //   dateOfBirth?: Date;
  // };

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Rental' }] })
  rentalHistory: Types.ObjectId[];
}

export const userSchema = SchemaFactory.createForClass(User);
