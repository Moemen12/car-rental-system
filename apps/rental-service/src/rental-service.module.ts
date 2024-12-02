import { Module } from '@nestjs/common';
import { RentalServiceController } from './rental-service.controller';
import { RentalServiceService } from './rental-service.service';
import { CommonModule } from '@app/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Rental, RentalSchema } from './schemas/rental.schema';

@Module({
  imports: [
    CommonModule.register(),
    MongooseModule.forFeature([
      {
        name: Rental.name,
        schema: RentalSchema,
      },
    ]),
  ],
  controllers: [RentalServiceController],
  providers: [RentalServiceService],
})
export class RentalServiceModule {}
