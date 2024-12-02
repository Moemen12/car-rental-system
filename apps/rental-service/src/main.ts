import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { RentalServiceModule } from './rental-service.module';

async function bootstrap() {
  const appContext =
    await NestFactory.createApplicationContext(RentalServiceModule);
  const configService = appContext.get(ConfigService);

  const host: string = configService.get('RENT_SERVICE_HOST');
  const port: number = configService.get('RENT_SERVICE_PORT');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    RentalServiceModule,
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
