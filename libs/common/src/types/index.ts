import { ROLE } from '@app/database/types';
import { Types } from 'mongoose';

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
