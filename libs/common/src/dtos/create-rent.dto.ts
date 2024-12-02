import {
  HasMimeType,
  IsFile,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';
import { convertMbToBytes } from '../utilities/general';

export class CreateRentDto {
  @IsFile()
  @MaxFileSize(convertMbToBytes(2))
  @HasMimeType(['image/jpeg', 'image/png'])
  driverLicense: MemoryStoredFile;
}
