import { ROLE } from '@app/database/types';
import { Types } from 'mongoose';
import { UpdateCarStatusDto } from '../dtos/update-car-status.dto';
import { CreateRentDto } from '../dtos/create-rent.dto';

export interface AuthAccessType {
  access_token: string;
}

export interface HeaderData {
  userId: string;
  fullName: string;
  email: string;
  role: ROLE;
  iat: number;
  exp: number;
}

export interface EmailRegistrationData {
  email: string;
  fullName: string;
}

export interface UserInfo {
  fullName: string;
  role: string;
  rentalHistory: Types.ObjectId[];
  isActive: boolean;
}

export interface SuccessMessage {
  message: string;
}

export interface UpdateCarStatus {
  updateCarDto: UpdateCarStatusDto;
  carId: string;
}

export type RentCar = HeaderData & CreateRentDto;

export interface CarInfo {
  currentPrice: number;
  carModel: string;
}

export interface EmailConfirmationData {
  email: string;
  fullName: string;
  totalCost: number;
  carModel: string;
  paymentIntentId: string;
  rentalDuration: string;
  paymentMethod: string;
  currency: string;
}

export interface UpdateUserRentals {
  userId: string;
  rentalId: string;
}
export interface UpdatedCar {
  carId: string;
  carModel: string;
}

export interface PaymentConfirmation {
  headerData: HeaderData;
  paymentId: string;
}

export interface ErrorResShape {
  expected: boolean;
  message: string;
  status: number;
  error: string;
  unexpectedErrorMsg: string;
}

export interface RentalInvoiceData {
  to: string;
  customerName: string;
  carModel: string;
  startDate: string;
  endDate: string;
  duration: string;
  rentalCost: string;
  totalCost: string;
  currency: string;
  invoiceNumber: string;
  paymentId: string;
  currentDate: string;
}
