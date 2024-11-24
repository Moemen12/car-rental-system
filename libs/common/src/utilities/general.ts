import { InternalServerErrorException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcryptjs';

export async function saltAndHashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  try {
    const hashPassword = await bcrypt.hash(password, saltRounds);
    return hashPassword;
  } catch (error) {
    throw new InternalServerErrorException(error);
  }
}

export function throwCustomError(message: string, status: number) {
  throw new RpcException({
    message,
    status,
    error: message,
  });
}

export function RethrowGeneralError(error: Error) {
  throw new RpcException({
    message: 'An error occurred',
    statusCode: 500,
    error: error ? error.message : 'An error occurred',
  });
}
