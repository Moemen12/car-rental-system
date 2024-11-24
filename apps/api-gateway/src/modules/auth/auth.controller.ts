import { AuthAccessType } from '@app/common';
import { CreateUserDto } from '@app/common/dtos/create-user.dto';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}
  @Post('register')
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
