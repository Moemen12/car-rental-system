import { Catch, RpcExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import chalk from 'chalk';

@Catch()
export class MicroserviceExceptionFilter
  implements RpcExceptionFilter<RpcException>
{
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    console.log(
      chalk.redBright('Error has caught in Microservice exception filter\n'),
      exception,
    );

    if (exception instanceof RpcException) {
      console.log(exception.getError());
      // update from return   throwError(() => exception.getError());
      throwError(() => exception.getError());
    }

    return throwError(() => ({
      message: exception.message,
      status: exception.status || 500,
      error: exception.error || 'Internal server error',
    }));
  }
}
