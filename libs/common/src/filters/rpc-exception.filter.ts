import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';

import chalk from 'chalk';
import { Response } from 'express';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    process.env.DEBUG_MODE === 'true'
      ? console.log(
          chalk.blueBright('Error has caught in RPC exception filter\n'),
          exception,
        )
      : void 0;

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception?.error?.expected) {
      if (!exception?.error?.message && !exception?.error?.status) {
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: exception?.error?.unexpectedErrorMsg,
          error: HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR],
        });
      }
      return response.status(exception.error.status).json({
        statusCode: exception.error.status,
        message: exception.error.message,
        error: exception.error.error,
      });
    } else if (
      exception?.response?.message &&
      Array.isArray(exception.response.message)
    ) {
      return response.status(exception.status || HttpStatus.BAD_REQUEST).json({
        statusCode: exception.status || HttpStatus.BAD_REQUEST,
        message: exception.response.message[0],
        error: exception.response.error || 'Validation Error',
      });
    } else if (
      exception.response.statusCode === HttpStatus.NOT_FOUND &&
      exception.response.error === 'Not Found'
    ) {
      return response.status(exception.response.statusCode).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: exception.response.message,
        error: exception.response.error,
      });
    }

    // Default error response
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message:
        exception.message || HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR],
      error: exception.error || null,
    });
  }
}
