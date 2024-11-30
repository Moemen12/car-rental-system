import { CarType, MaintenanceStatus, Status } from '@app/database/types';
import { countries } from 'countries-list';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  IsIn,
} from 'class-validator';

const VALID_COUNTRIES = Object.keys(countries).map(
  (code) => countries[code].name,
);

export class CreateCarDto {
  @IsString()
  @IsNotEmpty()
  carModel: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsEnum(CarType)
  @IsNotEmpty()
  type: CarType;

  @Min(0)
  @IsNumber({}, { message: 'base Price should be a number' })
  @IsNotEmpty()
  basePrice: number;

  @Min(0)
  @IsNumber({}, { message: 'current Price should be a number' })
  @IsNotEmpty()
  currentPrice: number;

  @IsEnum(Status)
  @IsNotEmpty()
  status: Status;

  @IsEnum(MaintenanceStatus)
  @IsNotEmpty()
  maintenanceStatus: MaintenanceStatus;

  @IsIn(VALID_COUNTRIES, {
    message: (args) =>
      `${args.value} is not a valid country. Please provide a valid country name.`,
  })
  @IsString()
  @IsNotEmpty()
  location: string;
}
