import { Status } from '@app/database/types';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateCarStatusDto {
  @IsEnum(Status)
  @IsNotEmpty()
  status: Status;
}
