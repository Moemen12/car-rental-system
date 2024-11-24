import { Controller, Get } from '@nestjs/common';
import { RentalServiceService } from './rental-service.service';

@Controller()
export class RentalServiceController {
  constructor(private readonly rentalServiceService: RentalServiceService) {}

  @Get()
  getHello(): string {
    return this.rentalServiceService.getHello();
  }
}
