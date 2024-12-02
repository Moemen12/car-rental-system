import { ROLE } from '@app/database/types';
import { Types } from 'mongoose';
import { UpdateCarStatusDto } from '../dtos/update-car-status.dto';
import { CreateUserDto } from '../dtos/create-user.dto';
import { CreateRentDto } from '../dtos/create-rent.dto';

export interface AuthAccessType {
  access_token: string;
}

export interface HeaderData {
  userId: string;
  username: string;
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
