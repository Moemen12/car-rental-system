import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@app/common/decorators/role.decorator';
import { ROLE } from '@app/database/types';
import { ClientProxy } from '@nestjs/microservices';
import { CreateCarDto } from '@app/common/dtos/create-car.dto';
import { lastValueFrom } from 'rxjs';
import { SuccessMessage } from '@app/common';

@UseGuards(RolesGuard)
@Controller('cars')
export class CarController {
  constructor(@Inject('CAR_SERVICE') private readonly carClient: ClientProxy) {}
  @Post()
  @Roles(ROLE.CUSTOMER)
  async addCar(@Body() createCatDto: CreateCarDto): Promise<SuccessMessage> {
    return lastValueFrom(this.carClient.send({ cmd: 'add-car' }, createCatDto));
  }
}
