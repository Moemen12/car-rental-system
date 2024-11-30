import { Module } from '@nestjs/common';
import { CarServiceController } from './car-service.controller';
import { CarServiceService } from './car-service.service';
import { CommonModule } from '@app/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Car, carSchema } from '../schemas/car.schema';

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
  providers: [CarServiceService],
})
export class CarServiceModule {}
