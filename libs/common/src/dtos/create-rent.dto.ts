import {
  HasMimeType,
  IsFile,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';
import { convertMbToBytes } from '../utilities/general';
import {
  IsDateString,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { IsFutureDate } from '../decorators/is-future-date.decorator';
import { countries } from 'countries-list';

const VALID_COUNTRIES = Object.keys(countries).map(
  (code) => countries[code].name,
);

export class CreateRentDto {
  // @IsFile()
  // @MaxFileSize(convertMbToBytes(2))
  // @HasMimeType(['image/jpeg', 'image/png'])
  // driverLicense: MemoryStoredFile;

  @IsMongoId()
  carId: string;

  @IsFutureDate({
    message:
      'Start date should be a future date. Please select a valid start date.',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsFutureDate({
    message:
      'Start date should be a future date. Please select a valid start date.',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsIn(VALID_COUNTRIES, {
    message: (args) =>
      `${args.value} is not a valid country. Please provide a valid country name.`,
  })
  @IsString()
  @IsNotEmpty()
  location: string;
}
