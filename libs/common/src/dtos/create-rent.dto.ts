import {
  IsDateString,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsString,
} from 'class-validator';

import { countries } from 'countries-list';
import { IsFutureDateAndBefore } from '../decorators/is-future-date.decorator';

const VALID_COUNTRIES = Object.keys(countries).map(
  (code) => countries[code].name,
);

export class CreateRentDto {
  @IsMongoId()
  carId: string;

  @IsFutureDateAndBefore(undefined, {
    message: 'Start date should be a future date.',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsFutureDateAndBefore('startDate', {
    message: 'End date must be a future date and after the start date.',
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
