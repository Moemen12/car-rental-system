import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  HasMimeType,
  IsFile,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';
import { convertMbToBytes } from '../utilities/general';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @MaxLength(20)
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsFile()
  @MaxFileSize(convertMbToBytes(2), {
    message: 'Maximum file size is 2MB',
  })
  @HasMimeType(['image/jpeg', 'image/png'])
  driverLicense: MemoryStoredFile;

  @Transform(({ value }) => value.toUpperCase())
  @Matches(/^[A-Za-z0-9]+$/, {
    message: 'Driver License ID must be alphanumeric',
  })
  @MaxLength(20)
  @MinLength(5)
  @IsString()
  @IsNotEmpty()
  driverLicenseId: string;
}
