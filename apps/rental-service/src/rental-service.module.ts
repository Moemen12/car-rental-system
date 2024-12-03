import { Module } from '@nestjs/common';
import { RentalServiceController } from './rental-service.controller';
import { RentalServiceService } from './rental-service.service';
import { CommonModule } from '@app/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Rental, RentalSchema } from './schemas/rental.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentSchema } from './schemas/payment.schema';

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
    ]),
    ClientsModule.registerAsync([
      {
        name: 'RENT_EMAIL_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('RENT_EMAIL_SERVICE_HOST'),
            port: configService.get('RENT_EMAIL_SERVICE_PORT'),
          },
        }),
      },
    ]),
  ],
  controllers: [RentalServiceController],
  providers: [RentalServiceService],
})
export class RentalServiceModule {}
