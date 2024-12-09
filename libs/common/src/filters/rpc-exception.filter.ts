import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import chalk from 'chalk';
import { Response } from 'express';
import { ErrorResShape } from '../types';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  private isErrorResShape(exception: any): exception is ErrorResShape {
    return (
      exception &&
      typeof exception.status === 'number' &&
      typeof exception.message === 'string' &&
      typeof exception.expected === 'boolean' &&
      typeof exception.unexpectedErrorMsg === 'string'
    );
  }

  catch(exception: any, host: ArgumentsHost) {
    console.log(
      chalk.blueBright('Error has caught in RPC exception filter\n'),
      exception,
    );

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = 500;
    let message: string | string[] = 'Internal server error';
    let error: string | null = null;
    let unexpectedErrorMsg;

    // Handle RPC Exceptions
    if (exception instanceof RpcException) {
      const rpcError = exception.getError() as any;
      status = rpcError.status || rpcError.statusCode || 500;
      message = rpcError.message || 'Internal server error';
      error = rpcError.error;
    }
    // Handle validation errors
    else if (
      exception?.response?.message &&
      Array.isArray(exception.response.message)
    ) {
      status = exception.status || 400;
      message = exception.response.message[0];
      error = exception.response.error || 'Validation Error';
    }
    // Handle direct HTTP exceptions
    else if (this.isErrorResShape(exception)) {
      console.log('here', exception);

      status = exception.status;
      message = exception.message;
      error = exception.error;
      unexpectedErrorMsg = exception.unexpectedErrorMsg;
    } else {
      status = exception.statusCode || 500;
      message = exception.message || 'Internal server error';
      error = exception.error || null;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
    });
  }
}
