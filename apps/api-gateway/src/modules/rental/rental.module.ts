import { Module } from '@nestjs/common';
import { RentalController } from './rental.controller';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    NestjsFormDataModule.config({
      limits: {
        files: 1,
      },
    }),
    ClientsModule.registerAsync([
      {
        inject: [ConfigService],
        name: 'RENT_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('RENT_SERVICE_HOST'),
            port: configService.get('RENT_SERVICE_PORT'),
          },
        }),
      },
    ]),
  ],
  controllers: [RentalController],
})
export class RentalModule {}
