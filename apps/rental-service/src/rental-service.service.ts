import {
  CarInfo,
  EmailConfirmationData,
  HeaderData,
  RentCar,
  UpdateUserRentals,
} from '@app/common';
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Rental } from './schemas/rental.schema';
import { Model, Types } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment } from './schemas/payment.schema';
import { decrypt, throwCustomError } from '@app/common/utilities/general';
import { confirmationHtml } from './constants';

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
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_API_KEY'));
  }

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
      // 1. Get car data and calculate cost
      const { currentPrice, carModel }: CarInfo = await lastValueFrom(
        this.carClient.send({ cmd: 'get-car-data' }, carId),
      );

      const start = new Date(startDate);
      const end = new Date(endDate);
      const timeDifference = end.getTime() - start.getTime();
      const numberOfDays = timeDifference / (1000 * 3600 * 24);
      const totalCost = currentPrice * numberOfDays;

      // 2. Create rental record
      const rental = await this.rentalModel.create({
        userId,
        carId,
        startDate,
        endDate,
        totalCost,
        status: 'pending',
      });

      // 3. Create a PaymentIntent
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

      console.log(rentalId);

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
      console.log(error);

      throwCustomError(error.message || 'Failed to create rental', 400);
    }
  }

  async confirmRenting(paymentId: string, headerData: HeaderData) {
    const decryptedPaymentId = decrypt(paymentId);

    // Fetch payment from database
    const payment = await this.paymentModel
      .findOne({
        paymentIntentId: decryptedPaymentId,
        customerId: headerData.userId,
      })
      .lean()
      .exec();

    const rental = await this.rentalModel
      .findOne({ _id: payment.rentalId })
      .populate('carId') // Populates the car details
      .exec();

    // Validate payment
    if (!payment) {
      throwCustomError('Payment not found', 404);
    }

    if (payment.status === 'confirmed') {
      throwCustomError('Payment has already been confirmed.', 409);
    }

    try {
      const [stripeConfirmation, updatedPayment] = await Promise.all([
        this.stripe.paymentIntents.confirm(decryptedPaymentId, {
          payment_method: 'pm_card_visa',
        }),
        this.paymentModel
          .findOneAndUpdate(
            {
              paymentIntentId: decryptedPaymentId,
              customerId: headerData.userId,
            },
            { status: 'confirmed' },
            { new: true },
          )
          .exec(),
        // this.rentalModel.fin
      ]);

      if (!updatedPayment) {
        throwCustomError('Failed to update payment status', 500);
      }

      return confirmationHtml;
    } catch (error) {
      if (error.type === 'StripeInvalidRequestError') {
        throwCustomError(`Stripe error: ${error.message}`, 400);
      }

      throwCustomError('An error occurred during payment confirmation.', 500);
    }
  }
}
