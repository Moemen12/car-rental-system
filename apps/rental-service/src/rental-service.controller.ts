import { Controller, Get } from '@nestjs/common';
import { RentalServiceService } from './rental-service.service';
import { MessagePattern } from '@nestjs/microservices';
import { CreateRentDto } from '@app/common/dtos/create-rent.dto';

@Controller()
export class RentalServiceController {
  constructor(private readonly rentalServiceService: RentalServiceService) {}

  @MessagePattern({ cmd: 'rent-car' })
  async createRental(rentInfo: CreateRentDto) {
    return await this.rentalServiceService.createRental(rentInfo);
  }
}
