import { Controller, Get } from '@nestjs/common';
import { CarServiceService } from './car-service.service';

@Controller()
export class CarServiceController {
  constructor(private readonly carServiceService: CarServiceService) {}

  @Get()
  getHello(): string {
    return this.carServiceService.getHello();
  }
}
