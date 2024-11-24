import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { CarServiceModule } from './car-service.module';

async function bootstrap() {
  const appContext =
    await NestFactory.createApplicationContext(CarServiceModule);
  const configService = appContext.get(ConfigService);

  //TODO update both here
  const host: string = 'localhost';
  const port: number = 3434;
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

  await app.listen();
}
bootstrap();
