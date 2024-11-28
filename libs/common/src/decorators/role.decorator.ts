import { ROLE } from '@app/database/types';
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: ROLE[]) => SetMetadata('roles', roles);
