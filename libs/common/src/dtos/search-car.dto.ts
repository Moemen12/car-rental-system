import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsIn,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CarType, Status } from '@app/database/types';

export class CarSearchDto {
  @IsOptional()
  @IsString()
  carModel?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  type?: CarType;

  @IsOptional()
  @IsString()
  priceRange?: string; // Format: "minPrice-maxPrice" (e.g., "1000-5000")

  @IsOptional()
  @IsString()
  status?: Status;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  hitsPerPage?: number;
}
