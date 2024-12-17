import {
  ActiveRentalsResponse,
  CarInfo,
  CarInfos,
  EmailConfirmationData,
  HeaderData,
  RentalBase,
  RentalInvoiceData,
  RentalResponse,
  RentCar,
  SuccessMessage,
  UpdatedCar,
  UpdateUserRentals,
  UserInfo,
} from '@app/common';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
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
  formatDate,
  logError,
  throwCustomError,
} from '@app/common/utilities/general';
import { confirmationHtml, formattedDate } from './constants';
import {
  CarStatus,
  PaymentStatus,
  RentalStatus,
  ROLE,
} from '@app/database/types';

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
  async createRental({
    userId,
    carId,
    startDate,
    endDate,
    email,
    fullName,
  }: RentCar): Promise<SuccessMessage> {
    const CURRENCY = 'usd';
    try {
      const isDriverLicenseValid: boolean = await lastValueFrom(
        this.userClient.send({ cmd: 'is-driver-exist' }, userId),
      );

      const { currentPrice, carModel }: CarInfo = await lastValueFrom(
        this.carClient.send({ cmd: 'get-car-data' }, carId),
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
        amount: Math.round(totalCost * 100),
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

      await this.paymentModel.create({
        rentalId: rental._id,
        amount: totalCost,
        currency: CURRENCY,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: PaymentStatus.PENDING,
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

      await Promise.all([
        lastValueFrom(this.userClient.send({ cmd: 'adding-rented-car' }, data)),
        lastValueFrom(
          this.rentEmailCLient.send(
            { cmd: 'payment-confirmation-email' },
            emailConfirmationData,
          ),
        ),
      ]);

      return {
        message: 'Car rental created successfully with pending payment',
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
        throwCustomError('Payment not found', HttpStatus.NOT_FOUND);
      }

      if (payment.status === 'confirmed') {
        throwCustomError(
          'Payment has already been confirmed.',
          HttpStatus.CONFLICT,
        );
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
        throwCustomError(
          'Failed to update payment status',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
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
          status: CarStatus.RENTED,
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
        throwCustomError(
          `Stripe error: ${error.message}`,
          HttpStatus.NOT_FOUND,
        );
      }

      throwCustomError(
        error?.error?.message,
        error?.error?.status,
        'An error occurred during payment confirmation.',
      );
    }
  }

  async clearUserInfo(id: string) {
    await this.rentalModel.deleteMany({
      userId: id,
      status: RentalStatus.PENDING,
    });

    await this.paymentModel.deleteMany({
      customerId: id,
      status: RentalStatus.PENDING,
    });
  }

  async getActiveRentals(
    headerData: HeaderData,
  ): Promise<ActiveRentalsResponse> {
    try {
      const currentDate = new Date();

      const query: any = {
        status: CarStatus.RENTED,
        startDate: { $lt: currentDate },
        endDate: { $gt: currentDate },
      };

      if (headerData.role === ROLE.CUSTOMER) {
        query.userId = headerData.userId;
      }

      const activeRentals: RentalBase[] = await this.rentalModel
        .find(query)
        .select('startDate endDate totalCost carId')
        .lean<RentalBase[]>();

      const userInfo = await lastValueFrom<UserInfo>(
        this.userClient.send({ cmd: 'get-user-info' }, headerData),
      );

      const carIds = activeRentals.map((rental) => rental.carId.toString());

      const carsInfo: CarInfos[] = await lastValueFrom<CarInfos[]>(
        this.carClient.send({ cmd: 'get-car-info' }, carIds),
      );

      const rentalsWithCarInfo: RentalResponse[] = activeRentals.map(
        (rental) => {
          const carInfo = carsInfo.find(
            (car: CarInfos) => car._id.toString() === rental.carId.toString(),
          );
          const { carId, ...rentalWithoutCarId } = rental;

          return {
            ...rentalWithoutCarId,
            startDate: formatDate(rental.startDate),
            endDate: formatDate(rental.endDate),
            carModel: carInfo?.carModel,
            maintenanceStatus: carInfo?.maintenanceStatus,
          };
        },
      );

      return {
        userInfo,
        rentals: rentalsWithCarInfo,
      };
    } catch (error) {
      logError(error);
      throwCustomError(
        error?.error?.message,
        error?.error?.status,
        'Error During Retrieving Active Rentals',
      );
    }
  }
}
