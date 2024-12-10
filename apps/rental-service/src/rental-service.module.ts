import { Module } from '@nestjs/common';
import { RentalServiceController } from './rental-service.controller';
import { RentalServiceService } from './rental-service.service';
import { CommonModule } from '@app/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Rental, RentalSchema } from './schemas/rental.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { days, seconds } from '@nestjs/throttler';

@Module({
  imports: [
    CommonModule.register(),
    MongooseModule.forFeature([
      {
        name: Rental.name,
        schema: RentalSchema,
      },
      {
        name: Payment.name,
        schema: PaymentSchema,
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'CAR_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('CAR_SERVICE_HOST'),
            port: configService.get('CAR_SERVICE_PORT'),
          },
        }),
      },
      {
        name: 'USER_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('USER_SERVICE_HOST'),
            port: configService.get('USER_SERVICE_PORT'),
          },
        }),
      },
      ,
      {
        name: 'RENTAL_EMAIL_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
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
        }),
      },
      {
        name: 'USER_EMAIL_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: configService.get('USER_EMAIL_QUEUE_NAME'),
            queueOptions: {
              durable: true,
              arguments: {
                'x-message-ttl': days(
                  configService.get('USER_EMAIL_QUEUE_TTL'),
                ),
              },
            },
          },
        }),
      },
    ]),
  ],
  controllers: [RentalServiceController],
  providers: [RentalServiceService],
})
export class RentalServiceModule {}
