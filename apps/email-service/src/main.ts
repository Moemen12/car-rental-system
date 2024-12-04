import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { EmailServiceModule } from './email-service.module';
import { days, seconds } from '@nestjs/throttler';

async function bootstrap() {
  const appContext =
    await NestFactory.createApplicationContext(EmailServiceModule);
  const configService = appContext.get(ConfigService);

  const rabbitMqUrl = configService.get<string>('RABBITMQ_URL');

  const userQueueApp =
    await NestFactory.createMicroservice<MicroserviceOptions>(
      EmailServiceModule,
      {
        transport: Transport.RMQ,
        options: {
          urls: [rabbitMqUrl],
          queue: configService.get('USER_EMAIL_QUEUE_NAME'),
          queueOptions: {
            durable: true,
            arguments: {
              'x-message-ttl': days(configService.get('USER_EMAIL_QUEUE_TTL')),
            },
          },
        },
      },
    );

  const rentalQueueApp =
    await NestFactory.createMicroservice<MicroserviceOptions>(
      EmailServiceModule,
      {
        transport: Transport.RMQ,
        options: {
          urls: [rabbitMqUrl],
          queue: configService.get('RENTAL_EMAIL_QUEUE_NAME'),
          queueOptions: {
            durable: true,
            arguments: {
              'x-message-ttl': seconds(
                configService.get('RENTAL_EMAIL_QUEUE_TTL'),
              ),
            },
          },
        },
      },
    );

  await userQueueApp.listen();
  await rentalQueueApp.listen();
}

bootstrap();
