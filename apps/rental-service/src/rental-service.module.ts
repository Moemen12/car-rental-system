import { Module } from '@nestjs/common';
import { RentalServiceController } from './rental-service.controller';
import { RentalServiceService } from './rental-service.service';
import { CommonModule } from '@app/common';

@Module({
  imports: [CommonModule],
  controllers: [RentalServiceController],
  providers: [RentalServiceService],
})
export class RentalServiceModule {}
