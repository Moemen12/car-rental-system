import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { ROLE } from '@app/database/types';
import { throwCustomError } from '@app/common/utilities/general';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authGuard: AuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<ROLE[]>('roles', context.getHandler());

    if (!roles) {
      return this.authGuard.canActivate(context);
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user_info;

    if (!user) {
      throwCustomError(
        'Unauthorized access. Please log in to continue.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!roles.includes(user.role)) {
      throwCustomError(
        'You do not have the required permissions.',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
