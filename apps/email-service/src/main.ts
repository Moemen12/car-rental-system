import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { EmailServiceModule } from './email-service.module';

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
  await app.listen();
}
bootstrap();
