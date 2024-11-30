import { Controller, Get } from '@nestjs/common';
import { CarServiceService } from './car-service.service';
import { MessagePattern } from '@nestjs/microservices';
import { CreateCarDto } from '@app/common/dtos/create-car.dto';
import { SuccessMessage } from '@app/common';

@Controller()
export class CarServiceController {
  constructor(private readonly carServiceService: CarServiceService) {}

  @MessagePattern({ cmd: 'add-car' })
  async addCar(createCatDto: CreateCarDto): Promise<SuccessMessage> {
    return await this.carServiceService.addCar(createCatDto);
  }
}
