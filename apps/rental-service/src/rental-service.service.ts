import { CreateRentDto } from '@app/common/dtos/create-rent.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RentalServiceService {
  async createRental(rentInfo: CreateRentDto) {
    console.log(rentInfo);

    return rentInfo;
  }
}
