import { RentCar } from '@app/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RentalServiceService {
  async createRental(rentInfo: RentCar) {
    console.log(rentInfo);

    return rentInfo.username;
  }
}
