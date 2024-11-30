import { CreateCarDto } from '@app/common/dtos/create-car.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Car } from '../schemas/car.schema';
import { Model } from 'mongoose';
import { throwCustomError } from '@app/common/utilities/general';
import { SuccessMessage } from '@app/common';

@Injectable()
export class CarServiceService {
  constructor(@InjectModel(Car.name) private readonly carModel: Model<Car>) {}

  private validatePricing(basePrice: number, currentPrice: number): void {
    const minPrice = basePrice * 0.8; // Example: Current price should be at least 80% of base price
    const maxPrice = basePrice * 1.2; // Example: Current price should not exceed 120% of base price

    if (currentPrice < minPrice || currentPrice > maxPrice) {
      throwCustomError(
        `Current price ${currentPrice} must be between ${minPrice} and ${maxPrice}.`,
        400,
      );
    }
  }

  async addCar(createCarDto: CreateCarDto): Promise<SuccessMessage> {
    const { basePrice, currentPrice } = createCarDto;

    this.validatePricing(basePrice, currentPrice);

    try {
      const createdCar = await this.carModel.create(createCarDto);

      if (createdCar) {
        return { message: 'Car added successfully' };
      }
    } catch (error) {
      throwCustomError(error, 500);
    }
  }
}
