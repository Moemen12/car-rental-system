import {
  Catch,
  RpcExceptionFilter,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import chalk from 'chalk';

@Catch()
export class MicroserviceExceptionFilter
  implements RpcExceptionFilter<RpcException>
{
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    process.env.DEBUG_MODE === 'true'
      ? console.log(
          chalk.redBright(
            'Error has caught in Microservice exception filter\n',
          ),
          exception,
        )
      : void 0;

    if (exception instanceof RpcException) {
      return throwError(() => exception);
    }

    return throwError(() => ({
      message: exception.message,
      status: exception.status || HttpStatus.INTERNAL_SERVER_ERROR,
      error: exception.error || HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR],
    }));
  }
}
