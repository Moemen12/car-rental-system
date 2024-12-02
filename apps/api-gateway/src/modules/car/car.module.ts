import { Module } from '@nestjs/common';
import { CarController } from './car.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { minutes, seconds } from '@nestjs/throttler';

@Module({
  imports: [
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: configService.get('REDIS_HOST'),
            port: configService.get('REDIS_PORT'),
          },
          ttl: minutes(configService.get('REDIS_TTL')),
        });

        return {
          store: store as unknown as CacheStore,
        };
      },
    }),

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
