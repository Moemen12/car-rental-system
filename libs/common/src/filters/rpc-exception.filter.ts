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
  catch(exception: any, host: ArgumentsHost) {
    console.log(exception);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // If we have the error object with our custom structure
    if (exception?.error?.expected) {
      return response.status(exception.error.status).json({
        statusCode: exception.error.status,
        message: exception.error.message,
        error: exception.error.error,
      });
    } else if (
      exception?.response?.message &&
      Array.isArray(exception.response.message)
    ) {
      return response.status(exception.status || 400).json({
        statusCode: exception.status || 400,
        message: exception.response.message[0],
        error: exception.response.error || 'Validation Error',
      });
    } else {
      console.log('here', exception);
    }

    // Default error response
    return response.status(500).json({
      statusCode: 500,
      message: exception.message || 'Internal server error',
      error: exception.error || null,
    });
  }
}
