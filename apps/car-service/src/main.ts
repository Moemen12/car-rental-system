import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { CarServiceModule } from './car-service.module';
import { MicroserviceExceptionFilter } from '@app/common';

async function bootstrap() {
  const appContext =
    await NestFactory.createApplicationContext(CarServiceModule);
  const configService = appContext.get(ConfigService);

  const host: string = configService.get('CAR_SERVICE_HOST');
  const port: number = configService.get('CAR_SERVICE_PORT');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CarServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host,
        port,
      },
    },
  );

  app.useGlobalFilters(new MicroserviceExceptionFilter());
  await app.listen();
}
bootstrap();
