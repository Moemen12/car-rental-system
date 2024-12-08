import { Module } from '@nestjs/common';
import { CarServiceController } from './car-service.controller';
import { CarServiceService } from './car-service.service';
import { CommonModule } from '@app/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Car, carSchema } from '../schemas/car.schema';
import { AlgoliaService } from '@app/common/services';

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
  providers: [CarServiceService, AlgoliaService],
})
export class CarServiceModule {}
