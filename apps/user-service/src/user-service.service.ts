import {
  AuthAccessType,
  EmailRegistrationData,
  UpdateUserRentals,
  UserInfo,
} from '@app/common';
import { CreateUserDto } from '@app/common/dtos/create-user.dto';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  logError,
  RethrowGeneralError,
  saltAndHashPassword,
  throwCustomError,
} from '@app/common/utilities/general';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './schemas/user.schema';

import { ClientProxy } from '@nestjs/microservices';
import { ROLE } from '@app/database/types';
import { Rental } from 'apps/rental-service/src/schemas/rental.schema';

@Injectable()
export class UserServiceService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @Inject('USER_EMAIL_SERVICE') private readonly rabbitClient: ClientProxy,
    private readonly jwtService: JwtService,
  ) {}

  async findUserById(userId: string): Promise<boolean> {
    try {
      if (!isValidObjectId(userId)) {
        throwCustomError('Invalid user ID format.', 400);
      }

      const isUserExist = await this.userModel.findById(userId).lean().exec();

      return !!isUserExist;
    } catch (error) {
      throwCustomError(error, 400);
    }
  }

  async registerUser({
    email,
    password,
    fullName,
  }: CreateUserDto): Promise<AuthAccessType> {
    const existingUser = await this.userModel.findOne({ email }).lean().exec();
    if (existingUser) {
      throwCustomError('Email is already registered', 409);
    }

    const hashedPassword = await saltAndHashPassword(password);

    const userData = {
      fullName,
      email,
      password: hashedPassword,
    };

    try {
      const user = await this.userModel.create(userData);

      const payload = {
        userId: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: ROLE.CUSTOMER,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      if (accessToken) {
        // Send Welcome Email :)
        const data: EmailRegistrationData = { email, fullName };
        this.rabbitClient.emit({ cmd: 'send-email' }, data);
      }

      return { access_token: accessToken };
    } catch (error) {
      RethrowGeneralError(error);
    }
  }

  async loginUser({
    email,
    password,
  }: Omit<CreateUserDto, 'fullName'>): Promise<AuthAccessType> {
    try {
      const existingUser = await this.userModel
        .findOne({ email })
        .lean()
        .exec();

      if (!existingUser) {
        throwCustomError('No account associated with this email address.', 404);
      }

      const passwordMatched = await bcrypt.compare(
        password,
        existingUser.password,
      );

      if (!passwordMatched) {
        throwCustomError('Incorrect Credentials', 401);
      }

      const payload = {
        userId: existingUser._id.toString(),
        email: existingUser.email,
        fullName: existingUser.fullName,
        role: existingUser.role,
      };
      const access_token = await this.jwtService.signAsync(payload);

      return {
        access_token,
      };
    } catch (error) {
      logError(error);
      throwCustomError(
        error?.error?.message,
        error?.error?.status,
        'An error occurred during payment confirmation.',
      );
    }
  }

  async getUserProfile(id: string): Promise<UserInfo> {
    const userDetails = await this.userModel
      .findById(id)
      .lean()
      .select('fullName role rentalHistory isActive')
      .exec();

    return userDetails;
  }

  async deleteUserAccount(id: string): Promise<{ deleted: boolean }> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();

    if (result.deletedCount === 0) {
      throwCustomError('User not found', 404);
    }

    return { deleted: true };
  }

  async addingRentedCar(data: UpdateUserRentals) {
    return await this.userModel
      .findByIdAndUpdate(data.userId, {
        $push: { rentalHistory: data.rentalId },
      })
      .exec();
  }
}
