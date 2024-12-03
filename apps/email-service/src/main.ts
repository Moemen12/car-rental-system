import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { EmailServiceModule } from './email-service.module';
import { ClientsModule } from '@nestjs/microservices';

async function bootstrap() {
  const appContext =
    await NestFactory.createApplicationContext(EmailServiceModule);
  const configService = appContext.get(ConfigService);

  const host: string = configService.get('RABBITMQ_URL');

  const app = await NestFactory.createMicroservice(EmailServiceModule, {
    transport: Transport.RMQ,
    options: {
      urls: [host],
      queue: 'email_queue',
      queueOptions: {
        durable: false,
      },
    },
  });

  const tcpApp = await NestFactory.createMicroservice(EmailServiceModule, {
    transport: Transport.TCP,
    options: {
      host: configService.get('RENT_EMAIL_SERVICE_HOST'),
      port: configService.get('RENT_EMAIL_SERVICE_PORT'),
    },
  });

  await Promise.all([app.listen(), tcpApp.listen()]);
}

bootstrap();
