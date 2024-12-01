import { Module } from '@nestjs/common';
import { CarServiceController } from './car-service.controller';
import { CarServiceService } from './car-service.service';
import { CommonModule } from '@app/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Car, carSchema } from '../schemas/car.schema';
import { ConfigService } from '@nestjs/config';
import { Cacheable } from 'cacheable';
import KeyvRedis from '@keyv/redis';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Car.name,
        schema: carSchema,
      },
    ]),
    CommonModule.register(),
  ],
  controllers: [CarServiceController],
  providers: [
    CarServiceService,
    {
      provide: 'CACHE_INSTANCE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URI');
        const secondary = new KeyvRedis(redisUrl);
        return new Cacheable({
          secondary,
          ttl: configService.get('REDIS_TTL'),
          namespace: 'car-service',
        });
      },
    },
  ],
  exports: ['CACHE_INSTANCE'],
})
export class CarServiceModule {}
