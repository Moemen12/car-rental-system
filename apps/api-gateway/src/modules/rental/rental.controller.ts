import { CreateRentDto } from '@app/common/dtos/create-rent.dto';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FormDataRequest } from 'nestjs-form-data';
import { lastValueFrom } from 'rxjs';

@Controller('rentals')
export class RentalController {
  constructor(
    @Inject('RENT_SERVICE') private readonly carClient: ClientProxy,
  ) {}
  @Post()
  @FormDataRequest()
  async createRental(@Body() rentInfo: CreateRentDto) {
    return lastValueFrom(this.carClient.send({ cmd: 'rent-car' }, rentInfo));
  }
}
