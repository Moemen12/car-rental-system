import { Controller } from '@nestjs/common';
import { RentalServiceService } from './rental-service.service';
import { EventPattern, MessagePattern } from '@nestjs/microservices';

import {
  HeaderData,
  PaymentConfirmation,
  RentCar,
  SuccessMessage,
} from '@app/common';

@Controller()
export class RentalServiceController {
  constructor(private readonly rentalServiceService: RentalServiceService) {}

  @MessagePattern({ cmd: 'rent-car' })
  async createRental(rentInfo: RentCar): Promise<SuccessMessage> {
    return await this.rentalServiceService.createRental(rentInfo);
  }

  @MessagePattern({ cmd: 'confirm-payment' })
  async confirmRenting({ headerData, paymentId }: PaymentConfirmation) {
    return await this.rentalServiceService.confirmRenting(
      paymentId,
      headerData,
    );
  }

  @EventPattern({ cmd: 'clear-unnecessary-related-user-info' })
  async clearUserInfo(id: string) {
    return await this.rentalServiceService.clearUserInfo(id);
  }

  @MessagePattern({ cmd: 'get-active-rentals' })
  async getActiveRentals(headerData: HeaderData) {
    return await this.rentalServiceService.getActiveRentals(headerData);
  }
}
