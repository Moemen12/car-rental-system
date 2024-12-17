import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CarType, CarStatus } from '@app/database/types';

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
  priceRange?: string;

  @IsOptional()
  @IsString()
  status?: CarStatus;

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
