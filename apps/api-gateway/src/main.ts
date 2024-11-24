import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as compression from 'compression';
import { RpcExceptionFilter } from '@app/common';
async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.use(
    compression({
      filter: () => {
        return true;
      },

      threshold: 0,
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
    }),
  );
  app.useGlobalFilters(new RpcExceptionFilter());
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}
bootstrap();
