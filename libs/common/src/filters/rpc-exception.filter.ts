import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
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
      // typeof exception.status === 'number' &&
      // typeof exception.message === 'string' &&
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

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error: string | null = null;

    // Handle RPC Exceptions
    if (exception instanceof RpcException) {
      const rpcError = exception.getError() as any;
      status =
        rpcError.status ||
        rpcError.statusCode ||
        HttpStatus.INTERNAL_SERVER_ERROR;
      message = rpcError.message || 'Internal server error';
      error = rpcError.error;
    }
    // Handle validation errors
    else if (
      exception?.response?.message &&
      Array.isArray(exception.response.message)
    ) {
      status = exception.status || HttpStatus.BAD_REQUEST;
      message = exception.response.message[0];
      error = exception.response.error || 'Validation Error';
    }
    // Handle direct HTTP exceptions
    else if (this.isErrorResShape(exception)) {
      status = exception.status || HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || exception.unexpectedErrorMsg;
      error = exception.error || exception.unexpectedErrorMsg;
    } else {
      status = exception.status || HttpStatus.INTERNAL_SERVER_ERROR;
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
