import { CreateRentDto } from '@app/common/dtos/create-rent.dto';
import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FormDataRequest } from 'nestjs-form-data';
import { lastValueFrom } from 'rxjs';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@app/common/decorators/role.decorator';
import { ROLE } from '@app/database/types';
import { User } from '@app/common/decorators/user.decorator';
import { HeaderData, RentCar } from '@app/common';

@UseGuards(RolesGuard)
@Controller('rentals')
export class RentalController {
  constructor(
    @Inject('RENT_SERVICE') private readonly carClient: ClientProxy,
  ) {}
  @Post()
  @Roles(ROLE.ADMIN, ROLE.CUSTOMER)
  @FormDataRequest()
  async createRental(
    @Body() rentInfo: CreateRentDto,
    @User() headerData: HeaderData,
  ) {
    const data: RentCar = { ...rentInfo, ...headerData };
    return lastValueFrom(this.carClient.send({ cmd: 'rent-car' }, data));
  }
}
