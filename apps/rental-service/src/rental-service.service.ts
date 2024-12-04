import { CarInfo, EmailConfirmationData, RentCar } from '@app/common';
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Rental } from './schemas/rental.schema';
import { Model } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment } from './schemas/payment.schema';
import { throwCustomError } from '@app/common/utilities/general';

@Injectable()
export class RentalServiceService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Rental.name) private readonly rentalModel: Model<Rental>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    @Inject('CAR_SERVICE') private readonly carClient: ClientProxy,
    @Inject('RENTAL_EMAIL_SERVICE')
    private readonly rentEmailCLient: ClientProxy,
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
        currency: 'usd',
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

      // 4. Create payment record
      await this.paymentModel.create({
        rentalId: rental._id,
        amount: totalCost,
        currency: 'usd',
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
      };

      return await lastValueFrom(
        this.rentEmailCLient.send(
          { cmd: 'payment-confirmation-email' },
          emailConfirmationData,
        ),
      );
      // 5. Return the client_secret and rental details
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        rentalId: rental._id,
        totalCost,
      };
    } catch (error) {
      console.log(error);

      throwCustomError(error.message || 'Failed to create rental', 400);
    }
  }

  async handleStripeWebhook(event: Stripe.Event) {
    try {
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const rentalId = paymentIntent.metadata.rentalId;

        await Promise.all([
          this.paymentModel.findOneAndUpdate(
            { paymentIntentId: paymentIntent.id },
            {
              status: 'succeeded',
              metadata: paymentIntent.metadata,
            },
          ),
          this.rentalModel.findByIdAndUpdate(rentalId, { status: 'confirmed' }),
        ]);
      }

      if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const rentalId = paymentIntent.metadata.rentalId;

        await Promise.all([
          this.paymentModel.findOneAndUpdate(
            { paymentIntentId: paymentIntent.id },
            {
              status: 'failed',
              errorMessage: paymentIntent.last_payment_error?.message,
              metadata: paymentIntent.metadata,
            },
          ),
          this.rentalModel.findByIdAndUpdate(rentalId, { status: 'failed' }),
        ]);
      }
    } catch (error) {
      throw new BadRequestException('Failed to process webhook event');
    }
  }

  async refundPayment(rentalId: string, amount?: number) {
    try {
      const payment = await this.paymentModel.findOne({ rentalId });
      if (!payment) {
        throwCustomError('Payment not found', 400);
      }

      const refund = await this.stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      await this.paymentModel.findByIdAndUpdate(payment._id, {
        status: 'refunded',
        refundId: refund.id,
        refundedAmount: refund.amount / 100,
        refundedAt: new Date(),
      });

      await this.rentalModel.findByIdAndUpdate(rentalId, {
        status: 'cancelled',
      });

      return refund;
    } catch (error) {
      throwCustomError(error.message || 'Failed to process refund', 400);
    }
  }
}
