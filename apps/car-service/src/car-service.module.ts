import { Module } from '@nestjs/common';
import { CarServiceController } from './car-service.controller';
import { CarServiceService } from './car-service.service';
import { CommonModule } from '@app/common';

@Module({
  imports: [CommonModule],
  controllers: [CarServiceController],
  providers: [CarServiceService],
})
export class CarServiceModule {}
