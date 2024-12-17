import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';

import { ROLE } from '@app/database/types';

import { HeaderData } from '@app/common';
import { throwCustomError } from '@app/common/utilities/general';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, lastValueFrom } from 'rxjs';

@Injectable()
export class UserOwnershipGuard implements CanActivate {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const headerData: HeaderData = request.user_info;
    const requestedUserId = request.params.id;

    await lastValueFrom(
      this.userClient.send({ cmd: 'find-user-by-id' }, requestedUserId),
    );

    if (headerData.role === ROLE.ADMIN) {
      return true;
    }

    if (headerData.role === ROLE.CUSTOMER) {
      if (headerData.userId === requestedUserId) {
        return true;
      }
      throwCustomError(
        'You do not have permission to access this resource',
        HttpStatus.FORBIDDEN,
      );
    }
    return false;
  }
}
