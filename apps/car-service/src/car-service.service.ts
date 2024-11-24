import { Injectable } from '@nestjs/common';

@Injectable()
export class CarServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
