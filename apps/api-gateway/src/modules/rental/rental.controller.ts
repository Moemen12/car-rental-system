import { CreateRentDto } from '@app/common/dtos/create-rent.dto';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Response,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FormDataRequest } from 'nestjs-form-data';
import { lastValueFrom } from 'rxjs';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@app/common/decorators/role.decorator';
import { ROLE } from '@app/database/types';
import { User } from '@app/common/decorators/user.decorator';
import {
  HeaderData,
  PaymentConfirmation,
  RentCar,
  SuccessMessage,
} from '@app/common';
import { Response as Res } from 'express';
import { UserOwnershipGuard } from '../auth/guards/user-ownership.guard';

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
  ): Promise<SuccessMessage> {
    const data: RentCar = { ...rentInfo, ...headerData };
    return lastValueFrom(this.carClient.send({ cmd: 'rent-car' }, data));
  }

  @Get('/payment-confirmation/:paymentId')
  @Roles(ROLE.CUSTOMER, ROLE.ADMIN)
  async confirmRenting(
    @Param('paymentId') paymentId: string,
    @User() headerData: HeaderData,
    @Response() res: Res,
  ) {
    const data: PaymentConfirmation = { paymentId, headerData };

    const html = await lastValueFrom(
      this.carClient.send({ cmd: 'confirm-payment' }, data),
    );

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }
}
