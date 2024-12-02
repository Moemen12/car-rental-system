import { Controller } from '@nestjs/common';
import { RentalServiceService } from './rental-service.service';
import { MessagePattern } from '@nestjs/microservices';

import { RentCar } from '@app/common';

@Controller()
export class RentalServiceController {
  constructor(private readonly rentalServiceService: RentalServiceService) {}

  @MessagePattern({ cmd: 'rent-car' })
  async createRental(rentInfo: RentCar) {
    return await this.rentalServiceService.createRental(rentInfo);
  }
}
