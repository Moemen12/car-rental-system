import { RequestMethod } from '@nestjs/common';

export const publicRoutes = [
  { path: '/api/auth/login', method: RequestMethod.POST },
  { path: '/api/auth/register', method: RequestMethod.POST },
];
