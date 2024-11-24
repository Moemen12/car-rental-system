import { Injectable } from '@nestjs/common';

@Injectable()
export class RentalServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
