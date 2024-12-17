import { Controller } from '@nestjs/common';
import { UserServiceService } from './user-service.service';
import { MessagePattern } from '@nestjs/microservices';
import { CreateUserDto } from '@app/common/dtos/create-user.dto';

import {
  AuthAccessType,
  HeaderData,
  UpdateUserRentals,
  UserInfo,
} from '@app/common';

@Controller()
export class UserServiceController {
  constructor(private readonly userServiceService: UserServiceService) {}

  @MessagePattern({ cmd: 'register' })
  async registerUser(createUserDto: CreateUserDto): Promise<AuthAccessType> {
    return await this.userServiceService.registerUser(createUserDto);
  }

  @MessagePattern({ cmd: 'login' })
  async loginUser(
    loginUserDto: Omit<CreateUserDto, 'fullName'>,
  ): Promise<AuthAccessType> {
    return await this.userServiceService.loginUser(loginUserDto);
  }

  @MessagePattern({ cmd: 'find-user-by-id' })
  async findUserById(userId: string): Promise<boolean> {
    return await this.userServiceService.findUserById(userId);
  }

  @MessagePattern({ cmd: 'get-user-profile' })
  async getUserProfile(id: string): Promise<UserInfo> {
    return await this.userServiceService.getUserProfile(id);
  }

  @MessagePattern({ cmd: 'delete-user-profile' })
  async deleteUserAccount(id: string): Promise<void> {
    await this.userServiceService.deleteUserAccount(id);
    return;
  }

  @MessagePattern({ cmd: 'adding-rented-car' })
  async addingRentedCar(data: UpdateUserRentals) {
    return await this.userServiceService.addingRentedCar(data);
  }

  @MessagePattern({ cmd: 'update-user-profile' })
  async updateUserProfile(
    serializedData: any,
  ): Promise<{ driverLicenseImageUrl: string; fullName: string }> {
    const dataWithBuffer = {
      ...serializedData,
      driverLicense: {
        ...serializedData.driverLicense,
        buffer: Buffer.from(serializedData.driverLicense.buffer, 'base64'),
      },
    };

    return await this.userServiceService.updateUserProfile(dataWithBuffer);
  }

  @MessagePattern({ cmd: 'is-driver-exist' })
  async isDriverLicenseValid(userId: string): Promise<boolean> {
    return await this.userServiceService.isDriverLicenseValid(userId);
  }

  @MessagePattern({ cmd: 'get-user-info' })
  async getActiveRentals(headerData: HeaderData): Promise<{
    fullName: string;
    joinDate: string;
    driverLicenseImageUrl: string;
  }> {
    return await this.userServiceService.getActiveRentals(headerData);
  }
}
