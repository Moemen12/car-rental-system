import { AuthAccessType } from '@app/common';
import { CreateUserDto } from '@app/common/dtos/create-user.dto';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RethrowGeneralError,
  saltAndHashPassword,
  throwCustomError,
} from '@app/common/utilities/general';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './schemas/user.schema';
import { EmailService } from '@app/common/modules/email/email.service';

@Injectable()
export class UserServiceService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

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
        // role: existingUser.role,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      if (accessToken) {
        // Send Welcome Email :)
        this.emailService.sendRegistrationEmail(email, fullName);
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
    const existingUser = await this.userModel.findOne({ email }).lean().exec();

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

    try {
      const payload = {
        userId: existingUser._id.toString(),
        fullName: existingUser.fullName,
        // role: existingUser.role,
      };
      const access_token = await this.jwtService.signAsync(payload);

      return {
        access_token,
      };
    } catch (error) {
      RethrowGeneralError(error);
    }
  }
}
