import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { RentalServiceModule } from './rental-service.module';

async function bootstrap() {
  const appContext =
    await NestFactory.createApplicationContext(RentalServiceModule);
  const configService = appContext.get(ConfigService);

  //TODO update both here
  const host: string = 'localhost';
  const port: number = 4322;
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
