import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@app/common/decorators/role.decorator';
import { ROLE } from '@app/database/types';
import { ClientProxy } from '@nestjs/microservices';
import { CreateCarDto } from '@app/common/dtos/create-car.dto';
import { lastValueFrom } from 'rxjs';
import { SuccessMessage, UpdateCarStatus } from '@app/common';
import { UpdateCarStatusDto } from '@app/common/dtos/update-car-status.dto';
import { ObjectIdValidationPipe } from '@app/common/validations/objectId-validation.pipe';
import { CarSearchDto } from '@app/common/dtos/search-car.dto';
import { Cache, CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';

@Controller('cars')
@UseInterceptors(CacheInterceptor)
export class CarController {
  constructor(
    @Inject('CAR_SERVICE') private readonly carClient: ClientProxy,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get('search')
  @Roles(ROLE.CUSTOMER, ROLE.ADMIN)
  async searchCars(@Query() searchDto: CarSearchDto) {
    const cacheKey = `car-search:${JSON.stringify(searchDto)}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const freshData = await lastValueFrom(
      this.carClient.send({ cmd: 'search-for-car' }, searchDto),
    );

    await this.cacheManager.set(cacheKey, freshData);

    return freshData;
  }

  @UseGuards(RolesGuard)
  @Post()
  @Roles(ROLE.ADMIN)
  async addCar(@Body() createCarDto: CreateCarDto): Promise<SuccessMessage> {
    const result = await lastValueFrom(
      this.carClient.send({ cmd: 'add-car' }, createCarDto),
    );

    // Clear all car-related caches when data is modified
    await this.cacheManager.reset();
    return result;
  }

  @UseGuards(RolesGuard)
  @Patch('/:id/status')
  @Roles(ROLE.ADMIN)
  async updateCarAvailability(
    @Body() updateCarDto: UpdateCarStatusDto,
    @Param('id', ObjectIdValidationPipe) carId: string,
  ): Promise<SuccessMessage> {
    const data: UpdateCarStatus = {
      carId,
      updateCarDto,
    };
    const result = await lastValueFrom(
      this.carClient.send({ cmd: 'update-car-status' }, data),
    );

    // Clear all car-related caches when data is modified
    await this.cacheManager.reset();
    return result;
  }
}
