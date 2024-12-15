import { CreateCarDto } from '@app/common/dtos/create-car.dto';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Car } from '../schemas/car.schema';
import { Model } from 'mongoose';
import { logError, throwCustomError } from '@app/common/utilities/general';
import {
  CarInfo,
  SuccessMessage,
  UpdateCarStatus,
  UpdatedCar,
} from '@app/common';
import { CarSearchDto } from '@app/common/dtos/search-car.dto';
import { AlgoliaService } from '@app/common/services';
import { Status } from '@app/database/types';

@Injectable()
export class CarServiceService implements OnModuleInit {
  constructor(
    @InjectModel(Car.name) private readonly carModel: Model<Car>,
    private readonly algoliaService: AlgoliaService,
  ) {}

  async onModuleInit() {
    await this.algoliaService.initIndex(this.carIndex, {
      searchableAttributes: ['carModel', 'brand', 'location'],
      attributesForFaceting: [
        'filterOnly(brand)',
        'filterOnly(status)',
        'filterOnly(location)',
        'filterOnly(type)',
        'numericFilters(currentPrice)',
      ],
    });
  }

  private readonly carIndex = 'cars_index';

  private checkCarStatus(status: Status): void {
    const unavailableStatusMessages: Partial<
      Record<Status, { message: string; code: number }>
    > = {
      [Status.RENTED]: {
        message:
          'The requested car is currently rented and cannot be processed.',
        code: 400,
      },
      [Status.MAINTENANCE]: {
        message:
          'The requested car is under maintenance and is not available for rental.',
        code: 503,
      },
    };

    if (status in unavailableStatusMessages) {
      const { message, code } = unavailableStatusMessages[status]!;
      throwCustomError(message, code);
    }
  }

  private validatePricing(basePrice: number, currentPrice: number): void {
    const minPrice = basePrice * 0.8;
    const maxPrice = basePrice * 1.2;

    if (currentPrice < minPrice || currentPrice > maxPrice) {
      throwCustomError(
        `Current price ${currentPrice} must be between ${minPrice} and ${maxPrice}.`,
        400,
      );
    }
  }

  async addCar(createCarDto: CreateCarDto): Promise<SuccessMessage> {
    try {
      const { basePrice, currentPrice } = createCarDto;

      this.validatePricing(basePrice, currentPrice);
      const createdCar = await this.carModel.create(createCarDto);

      if (createdCar) {
        await this.algoliaService.saveObject(this.carIndex, {
          objectID: createdCar._id.toString(),
          carModel: createdCar.carModel,
          brand: createdCar.brand,
          type: createdCar.type,
          basePrice: createdCar.basePrice,
          currentPrice: createdCar.currentPrice,
          status: createdCar.status,
          maintenanceStatus: createdCar.maintenanceStatus,
          location: createdCar.location,
        });

        return { message: 'Car added successfully' };
      }
    } catch (error) {
      logError(error);
      throwCustomError(
        error?.error?.message,
        error?.error?.status,
        'Failed to Add new Car',
      );
    }
  }

  async searchCars(query: CarSearchDto) {
    const {
      carModel,
      brand,
      priceRange,
      status,
      location,
      type,
      page = 0,
      hitsPerPage = 20,
    } = query;

    try {
      // Build numeric filters for price range
      const numericFilters = [];
      if (priceRange) {
        const [minPrice, maxPrice] = priceRange.split('-').map(Number);
        if (!isNaN(minPrice)) {
          numericFilters.push(`currentPrice >= ${minPrice}`);
        }
        if (!isNaN(maxPrice)) {
          numericFilters.push(`currentPrice <= ${maxPrice}`);
        }
      }

      // Build facet filters as an array of arrays for AND conditions
      const facetFilters = [];
      if (brand) facetFilters.push([`brand:${brand}`]);
      if (status) facetFilters.push([`status:${status}`]);
      if (location) facetFilters.push([`location:${location}`]);
      if (type) facetFilters.push([`type:${type}`]);

      const searchOptions = {
        page,
        hitsPerPage,
        facetFilters: facetFilters.length ? facetFilters : undefined,
        numericFilters: numericFilters.length ? numericFilters : undefined,
        attributesToRetrieve: [
          'carModel',
          'brand',
          'type',
          'currentPrice',
          'status',
          'location',
          'maintenanceStatus',
          'objectID',
        ],
      };

      const searchResponse = await this.algoliaService.search(
        this.carIndex,
        carModel || '',
        searchOptions,
      );

      // Clean up the hits by removing _highlightResult and _rankingInfo
      const cleanHits = searchResponse.hits.map((hit) => {
        const { _highlightResult, _rankingInfo, ...cleanHit } = hit;
        return cleanHit;
      });

      return {
        hits: cleanHits,
        page: searchResponse.page,
        nbPages: searchResponse.nbPages,
      };
    } catch (error) {
      logError(error);
      throwCustomError(
        error?.error?.message,
        error?.error?.status,
        'Error performing search',
      );
    }
  }

  async updateCarAvailability({
    updateCarDto,
    carId,
  }: UpdateCarStatus): Promise<SuccessMessage> {
    try {
      const updatedCar = await this.carModel
        .findByIdAndUpdate(
          carId,
          {
            status: updateCarDto.status,
          },
          { new: true },
        )
        .exec();

      if (!updatedCar) {
        throwCustomError('Car not found', 404);
      }

      await this.algoliaService.updateObject(this.carIndex, carId, {
        status: updateCarDto.status,
      });

      return { message: 'Car updated successfully' };
    } catch (error) {
      logError(error);

      throwCustomError(
        error?.error?.message,
        error?.error?.status,
        'Failed to Update Car Availability',
      );
    }
  }

  async getCarData(carId: string): Promise<CarInfo> {
    try {
      throw new Error('moemen');
      const dataInfo = await this.carModel
        .findById(carId)
        .select('currentPrice carModel status')
        .lean()
        .exec();

      if (!dataInfo) {
        throwCustomError('No Car with info found', 404);
      }
      this.checkCarStatus(dataInfo.status);

      return dataInfo;
    } catch (error) {
      logError(error);

      throwCustomError(
        error?.error?.message,
        error?.error?.status,
        'Failed to Update get Car Info',
      );
    }
  }
  async updateCarStatus(carId: string): Promise<UpdatedCar> {
    try {
      const existingCar = await this.carModel.findById(carId).exec();

      if (!existingCar) {
        throwCustomError('No Car with info found', 404);
      }
      if (existingCar.status === Status.RENTED) {
        throwCustomError(
          'The requested car is currently rented and cannot be processed.',
          400,
        );
      }

      if (existingCar.status === Status.MAINTENANCE) {
        throwCustomError(
          'The requested car is under maintenance and is not available for rental.',
          503,
        );
      }
      const algoliaResult = await this.algoliaService.updateObject(
        this.carIndex,
        carId,
        { status: Status.RENTED },
      );

      await existingCar.updateOne({ status: Status.RENTED });

      if (!algoliaResult) {
        throwCustomError('Failed to update Algolia', 500);
      }

      return {
        carId: existingCar.id,
        carModel: existingCar.carModel,
      };
    } catch (error) {
      logError(error);
      throwCustomError(
        error?.error?.message,
        error?.error?.status,
        'Failed to Confirm Payment Process',
      );
    }
  }
}
