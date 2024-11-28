import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { throwCustomError } from '../utilities/general';

export class ObjectIdValidationPipe implements PipeTransform {
  transform(value: string) {
    if (!isValidObjectId(value)) {
      throwCustomError('Invalid ObjectId format.', 400);
    }
    return value;
  }
}
