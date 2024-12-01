import { Controller, Get, Inject } from '@nestjs/common';
import { CarServiceService } from './car-service.service';
import { MessagePattern } from '@nestjs/microservices';
import { CreateCarDto } from '@app/common/dtos/create-car.dto';
import { SuccessMessage } from '@app/common';
import { CarSearchDto } from '@app/common/dtos/search-car.dto';
import { Cacheable } from 'cacheable';
import { ConfigService } from '@nestjs/config';

@Controller()
export class CarServiceController {
  private readonly searchKeys: Set<string> = new Set();

  constructor(
    private readonly carServiceService: CarServiceService,
    private readonly configService: ConfigService,
    @Inject('CACHE_INSTANCE') private readonly cache: Cacheable,
  ) {}

  @MessagePattern({ cmd: 'add-car' })
  async addCar(createCarDto: CreateCarDto): Promise<SuccessMessage> {
    for (const key of this.searchKeys) {
      await this.cache.delete(key);
    }
    this.searchKeys.clear();

    return await this.carServiceService.addCar(createCarDto);
  }

  @MessagePattern({ cmd: 'search-for-car' })
  async searchFor(searchedCar: CarSearchDto) {
    const cacheKey = `car-search:${JSON.stringify(searchedCar)}`;

    this.searchKeys.add(cacheKey);

    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.carServiceService.searchCars(searchedCar);

    await this.cache.set(cacheKey, data, this.configService.get('REDIS_TTL'));

    return data;
  }
}
