import { CarStatus } from '@app/database/types';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateCarStatusDto {
  @IsEnum(CarStatus)
  @IsNotEmpty()
  status: CarStatus;
}
