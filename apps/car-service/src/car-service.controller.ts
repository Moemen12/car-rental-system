import { Controller, Get, Inject } from '@nestjs/common';
import { CarServiceService } from './car-service.service';
import { MessagePattern } from '@nestjs/microservices';
import { CreateCarDto } from '@app/common/dtos/create-car.dto';
import { CarInfo, SuccessMessage, UpdateCarStatus } from '@app/common';
import { CarSearchDto } from '@app/common/dtos/search-car.dto';
import { Cacheable } from 'cacheable';
import { ConfigService } from '@nestjs/config';
import { UpdateCarStatusDto } from '@app/common/dtos/update-car-status.dto';

@Controller()
export class CarServiceController {
  constructor(
    private readonly carServiceService: CarServiceService,
    private readonly configService: ConfigService,
  ) {}

  @MessagePattern({ cmd: 'add-car' })
  async addCar(createCarDto: CreateCarDto): Promise<SuccessMessage> {
    return await this.carServiceService.addCar(createCarDto);
  }

  @MessagePattern({ cmd: 'search-for-car' })
  async searchFor(searchedCar: CarSearchDto) {
    return await this.carServiceService.searchCars(searchedCar);
  }

  @MessagePattern({ cmd: 'update-car-status' })
  async updateCarAvailability(
    updateCarDto: UpdateCarStatus,
  ): Promise<SuccessMessage> {
    return await this.carServiceService.updateCarAvailability(updateCarDto);
  }

  @MessagePattern({ cmd: 'get-car-data' })
  async getCarData(carId: string): Promise<CarInfo> {
    return await this.carServiceService.getCarData(carId);
  }

  @MessagePattern({ cmd: 'update-car-rental-details' })
  async updateCarStatus(carId: string): Promise<boolean> {
    return await this.carServiceService.updateCarStatus(carId);
  }
}
