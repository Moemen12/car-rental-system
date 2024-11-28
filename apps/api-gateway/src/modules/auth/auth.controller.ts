import { AuthAccessType } from '@app/common';
import { Roles } from '@app/common/decorators/role.decorator';
import { CreateUserDto } from '@app/common/dtos/create-user.dto';
import { ROLE } from '@app/database/types';
import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { RolesGuard } from './guards/roles.guard';

// @UseGuards(RolesGuard)
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}
  @Post('register')
  // @Roles(ROLE.CUSTOMER)
  async registerUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<AuthAccessType> {
    return lastValueFrom(
      this.userClient.send<AuthAccessType, CreateUserDto>(
        { cmd: 'register' },
        createUserDto,
      ),
    );
  }

  @Post('login')
  // @Roles(ROLE.CUSTOMER, ROLE.ADMIN)
  async loginUser(
    @Body() loginUserDto: Omit<CreateUserDto, 'fullName'>,
  ): Promise<AuthAccessType> {
    return lastValueFrom(
      this.userClient.send<AuthAccessType, Omit<CreateUserDto, 'fullName'>>(
        { cmd: 'login' },
        loginUserDto,
      ),
    );
  }
}
