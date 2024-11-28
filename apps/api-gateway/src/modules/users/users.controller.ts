import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@app/common/decorators/role.decorator';
import { ROLE } from '@app/database/types';
import { UserOwnershipGuard } from 'apps/api-gateway/src/modules/auth/guards/user-ownership.guard';
import { ObjectIdValidationPipe } from '@app/common/pipe/objectId-validation.pipe';
import { ClientProxy } from '@nestjs/microservices';
import { defaultIfEmpty, lastValueFrom } from 'rxjs';
import { UserInfo } from '@app/common';
import { throwCustomError } from '@app/common/utilities/general';

@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  @Get('/:id/profile')
  @UseGuards(UserOwnershipGuard)
  @Roles(ROLE.CUSTOMER, ROLE.ADMIN)
  async getUserProfile(
    @Param('id', ObjectIdValidationPipe) id: string,
  ): Promise<UserInfo> {
    return lastValueFrom(this.userClient.send({ cmd: 'get-user-profile' }, id));
  }

  @Delete('/:id')
  @Roles(ROLE.ADMIN)
  @HttpCode(204)
  async deleteUserAccount(
    @Param('id', ObjectIdValidationPipe) id: string,
  ): Promise<void> {
    await lastValueFrom(
      this.userClient
        .send({ cmd: 'delete-user-profile' }, id)
        .pipe(defaultIfEmpty(null)),
    );
  }
}
