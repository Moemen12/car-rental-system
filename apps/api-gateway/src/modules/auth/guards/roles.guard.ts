import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard'; // Import your existing AuthGuard
import { ROLE } from '@app/database/types';
import { throwCustomError } from '@app/common/utilities/general';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authGuard: AuthGuard, // Inject AuthGuard instead of extending
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<ROLE[]>('roles', context.getHandler());

    // If no roles are defined, use AuthGuard to authenticate the user
    if (!roles) {
      return this.authGuard.canActivate(context);
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user_info;

    if (!user) {
      throwCustomError('Unauthorized access. Please log in to continue.', 401);
    }

    if (!roles.includes(user.role)) {
      throwCustomError('You do not have the required permissions.', 403);
    }

    return true;
  }
}
