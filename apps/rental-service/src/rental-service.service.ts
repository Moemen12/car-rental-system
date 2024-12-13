import {
  CarInfo,
  EmailConfirmationData,
  HeaderData,
  RentalInvoiceData,
  RentCar,
  UpdatedCar,
  UpdateUserRentals,
} from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Rental } from './schemas/rental.schema';
import { Model } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment } from './schemas/payment.schema';
import {
  calculateDaysDifference,
  decrypt,
  logError,
  throwCustomError,
} from '@app/common/utilities/general';
import { confirmationHtml, formattedDate } from './constants';
import { Status } from '@app/database/types';

@Injectable()
export class RentalServiceService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Rental.name) private readonly rentalModel: Model<Rental>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    @Inject('CAR_SERVICE') private readonly carClient: ClientProxy,
    @Inject('RENTAL_EMAIL_SERVICE')
    private readonly rentEmailCLient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    @Inject('USER_EMAIL_SERVICE') private readonly rabbitClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_API_KEY'));
  }
  //  onMOd
  async createRental({
    userId,
    carId,
    startDate,
    endDate,
    email,
    fullName,
  }: RentCar) {
    const CURRENCY = 'usd';
    try {
      const isDriverLicenseValid: boolean = await lastValueFrom(
        this.userClient.send({ cmd: 'is-driver-exist' }, userId),
      );

      const { currentPrice, carModel }: CarInfo = await lastValueFrom(
        this.carClient.send({ cmd: 'get-car-data' }, carId), // Error has throwed error here cause car has rented
      );

      const numberOfDays = calculateDaysDifference(
        new Date(startDate),
        new Date(endDate),
      );

      const totalCost = currentPrice * numberOfDays;

      const rental = await this.rentalModel.create({
        userId,
        carId,
        startDate,
        endDate,
        totalCost,
        status: 'pending',
      });

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(totalCost * 100), // Convert to cents
        currency: CURRENCY,
        metadata: {
          rentalId: rental._id.toString(),
          carId,
          userId,
          startDate: startDate.toString(),
          endDate: endDate.toString(),
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      });

      // // 4. Create payment record

      await this.paymentModel.create({
        rentalId: rental._id,
        amount: totalCost,
        currency: CURRENCY,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: 'pending',
        customerId: userId.toString(),
        metadata: paymentIntent.metadata,
        paymentMethodTypes: paymentIntent.payment_method_types,
      });

      const rentalDuration = `${numberOfDays} days`;
      const paymentMethod = paymentIntent.payment_method_types.join(', ');

      const emailConfirmationData: EmailConfirmationData = {
        fullName,
        email,
        totalCost,
        carModel,
        paymentIntentId: paymentIntent.id,
        rentalDuration,
        paymentMethod,
        currency: CURRENCY,
      };

      const rentalId = rental._id.toString();

      const data: UpdateUserRentals = {
        userId,
        rentalId,
      };

      await lastValueFrom(
        this.userClient.send({ cmd: 'adding-rented-car' }, data),
      );

      await lastValueFrom(
        this.rentEmailCLient.send(
          { cmd: 'payment-confirmation-email' },
          emailConfirmationData,
        ),
      );
      // 5. Return the client_secret and rental details
      return {
        // clientSecret: paymentIntent.client_secret,
        // paymentIntentId: paymentIntent.id,
        // rentalId: rental._id,
        // totalCost,
        anything: 'anything',
      };
    } catch (error) {
      logError(error);

      throwCustomError(
        error?.error?.message,
        error?.error?.status,
        'Failed to rent a Car',
      );
    }
  }

  async confirmRenting(paymentId: string, headerData: HeaderData) {
    try {
      const decryptedPaymentId = decrypt(paymentId);
      const payment = await this.paymentModel
        .findOne({
          paymentIntentId: decryptedPaymentId,
          customerId: headerData.userId,
        })
        .lean()
        .exec();

      if (!payment) {
        throwCustomError('Payment not found', 404);
      }

      if (payment.status === 'confirmed') {
        throwCustomError('Payment has already been confirmed.', 409);
      }

      await this.stripe.paymentIntents.confirm(decryptedPaymentId, {
        payment_method: 'pm_card_visa',
      });

      const updatedPayment = await this.paymentModel
        .findOneAndUpdate(
          {
            paymentIntentId: decryptedPaymentId,
            customerId: headerData.userId,
          },
          { status: 'confirmed' },
          { new: true },
        )
        .exec();

      if (!updatedPayment) {
        throwCustomError('Failed to update payment status', 500);
      }

      const { carId, carModel }: UpdatedCar = await lastValueFrom(
        this.carClient.send(
          { cmd: 'update-car-rental-details' },
          payment.metadata.carId,
        ),
      );

      await this.rentalModel.findOneAndUpdate(
        {
          carId: carId,
          userId: headerData.userId,
        },
        {
          status: Status.RENTED,
        },
      );

      const invoiceData: RentalInvoiceData = {
        to: headerData.email,
        customerName: headerData.fullName,
        carModel: carModel,
        startDate: payment.metadata.startDate,
        endDate: payment.metadata.endDate,
        duration: `${calculateDaysDifference(
          new Date(payment.metadata.startDate),
          new Date(payment.metadata.endDate),
        )} days`,

        rentalCost: String(payment.amount),
        totalCost: String(payment.amount),
        currency: payment.currency.toUpperCase(),
        invoiceNumber: payment._id.toString(),
        paymentId: paymentId,
        currentDate: formattedDate,
      };

      await lastValueFrom(
        this.rabbitClient.send({ cmd: 'send-invoice-email' }, invoiceData),
      );

      return confirmationHtml;
    } catch (error) {
      logError(error);
      if (error.type === 'StripeInvalidRequestError') {
        throwCustomError(`Stripe error: ${error.message}`, 400);
      }

      throwCustomError(
        error?.error?.message,
        error?.error?.status,
        'An error occurred during payment confirmation.',
      );
    }
  }
}
