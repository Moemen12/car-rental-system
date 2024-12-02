import { CreateCarDto } from '@app/common/dtos/create-car.dto';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Car } from '../schemas/car.schema';
import { Model } from 'mongoose';
import { throwCustomError } from '@app/common/utilities/general';
import { SuccessMessage, UpdateCarStatus } from '@app/common';
import { CarSearchDto } from '@app/common/dtos/search-car.dto';
import { searchClient } from '@algolia/client-search';
import { ConfigService } from '@nestjs/config';
import { Cacheable } from 'cacheable';
import { UpdateCarStatusDto } from '@app/common/dtos/update-car-status.dto';

@Injectable()
export class CarServiceService implements OnModuleInit {
  private readonly algoliaClient: ReturnType<typeof searchClient>;

  constructor(
    @InjectModel(Car.name) private readonly carModel: Model<Car>,

    private readonly configService: ConfigService,
  ) {
    this.algoliaClient = searchClient(
      this.configService.get('ALGOLIA_APP_ID'),
      this.configService.get('ALGOLIA_API_KEY'),
    );
  }

  async onModuleInit() {
    // Configure Algolia index settings
    await this.algoliaClient.setSettings({
      indexName: 'cars_index',
      indexSettings: {
        searchableAttributes: ['carModel', 'brand', 'location'],
        attributesForFaceting: [
          'brand',
          'status',
          'location',
          'type',
          'numericFilters(currentPrice)',
        ],
      },
      forwardToReplicas: true,
    });
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
    const { basePrice, currentPrice } = createCarDto;

    this.validatePricing(basePrice, currentPrice);

    try {
      const createdCar = await this.carModel.create(createCarDto);

      if (createdCar) {
        // Manually sync with Algolia
        await this.algoliaClient.saveObject({
          indexName: 'cars_index',
          body: {
            objectID: createdCar._id.toString(),
            carModel: createdCar.carModel,
            brand: createdCar.brand,
            type: createdCar.type,
            basePrice: createdCar.basePrice,
            currentPrice: createdCar.currentPrice,
            status: createdCar.status,
            maintenanceStatus: createdCar.maintenanceStatus,
            location: createdCar.location,
          },
        });

        return { message: 'Car added successfully' };
      }
    } catch (error) {
      throwCustomError(error, 500);
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
        if (!isNaN(minPrice))
          numericFilters.push(`currentPrice >= ${minPrice}`);
        if (!isNaN(maxPrice))
          numericFilters.push(`currentPrice <= ${maxPrice}`);
      }

      // Build facet filters
      const facetFilters = [];
      if (brand) facetFilters.push(`brand:${brand}`);
      if (status) facetFilters.push(`status:${status}`);
      if (location) facetFilters.push(`location:${location}`);
      if (type) facetFilters.push(`type:${type}`);

      // Perform search using searchSingleIndex
      const searchResponse = await this.algoliaClient.searchSingleIndex({
        indexName: 'cars_index',
        searchParams: {
          query: carModel || '',
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
          // getRankingInfo: true,
        },
      });

      // Clean up the hits by removing _highlightResult and _rankingInfo
      const cleanHits = searchResponse.hits.map((hit) => {
        const { _highlightResult, ...cleanHit } = hit;
        return cleanHit;
      });

      return {
        hits: cleanHits,
        page: searchResponse.page,
        nbPages: searchResponse.nbPages,
      };
    } catch (error) {
      throwCustomError('Error performing search', 500);
    }
  }

  async updateCarAvailability({
    updateCarDto,
    carId,
  }: UpdateCarStatus): Promise<SuccessMessage> {
    try {
      // Update MongoDB
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

      // Sync with Algolia
      await this.algoliaClient.partialUpdateObject({
        indexName: 'cars_index',
        objectID: carId,
        attributesToUpdate: {
          status: updateCarDto.status,
        },
        createIfNotExists: false,
      });

      return { message: 'Car updated successfully' };
    } catch (error) {
      console.error('Error updating car:', error);
      throwCustomError('Error updating car status', 500);
    }
  }
}
