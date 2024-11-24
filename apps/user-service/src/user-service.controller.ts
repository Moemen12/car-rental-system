import { Controller } from '@nestjs/common';
import { UserServiceService } from './user-service.service';
import { MessagePattern } from '@nestjs/microservices';
import { CreateUserDto } from '@app/common/dtos/create-user.dto';

import { AuthAccessType } from '@app/common';

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
}
