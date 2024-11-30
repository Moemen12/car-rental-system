import { Module } from '@nestjs/common';
import { CarController } from './car.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
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
  ],
  controllers: [CarController],
})
export class CarModule {}
