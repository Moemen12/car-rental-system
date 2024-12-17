import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import Mail from 'nodemailer/lib/mailer';
import { promises as fs } from 'fs';
import * as path from 'path';

import {
  EmailConfirmationData,
  RentalInvoiceData,
  SuccessMessage,
} from '@app/common';
import {
  encrypt,
  logError,
  throwCustomError,
} from '@app/common/utilities/general';
import { rentalInvoiceEmailBody } from './constants';

@Injectable()
export class EmailServiceService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private registrationEmailTemplate: string;
  private paymentConfirmationTemplate: string;
  private rentalInvoiceTemplate: string;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: parseInt(this.configService.get<string>('EMAIL_PORT')),
      secure: true,
      auth: {
        user: this.configService.get<string>('USER_EMAIL'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  // Initialize templates asynchronously during startup
  async onModuleInit() {
    const templatesPath = path.resolve(
      process.cwd(),
      'libs/common/src/utilities/templates',
    );

    this.registrationEmailTemplate = await fs.readFile(
      path.join(templatesPath, 'registration-email.html'),
      'utf8',
    );

    this.paymentConfirmationTemplate = await fs.readFile(
      path.join(templatesPath, 'payment.html'),
      'utf8',
    );

    this.rentalInvoiceTemplate = await fs.readFile(
      path.join(templatesPath, 'rental-invoice.html'),
      'utf8',
    );
  }

  private async generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
    // Lazy-load puppeteer only when needed
    const puppeteer = await import('puppeteer');

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set the content of the page
    await page.setContent(htmlContent, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm',
      },
      scale: 0.9,
      preferCSSPageSize: true,
    });

    await browser.close();

    return Buffer.from(pdfBuffer);
  }

  async sendRegistrationEmail(email: string, fullName: string) {
    const htmlContent = this.registrationEmailTemplate
      .replace(/{{fullName}}/g, fullName)
      .replace('{{email}}', email);

    const mailOptions: Mail.Options = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: '🚗 Welcome to CarRental - Your Account is Ready!',
      html: htmlContent,
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendPaymentConfirmation({
    email,
    fullName,
    totalCost,
    carModel,
    rentalDuration,
    paymentIntentId,
    paymentMethod,
    currency,
  }: EmailConfirmationData) {
    const encryptedId = encrypt(paymentIntentId);
    const CONFIRMATION_URL: string = `${this.configService.get('APP_URL')}/rentals/payment-confirmation/${encryptedId}`;
    const htmlContent = this.paymentConfirmationTemplate
      .replace(/{{fullName}}/g, fullName)
      .replace('{{email}}', email)
      .replace('{{totalCost}}', String(totalCost))
      .replace('{{carModel}}', carModel)
      .replace('{{rentalDuration}}', rentalDuration)
      .replace('{{paymentIntentId}}', paymentIntentId)
      .replace('{{paymentMethod}}', paymentMethod)
      .replace('{{currency}}', currency)
      .replace('{{confirmationUrl}}', CONFIRMATION_URL);

    const mailOptions: Mail.Options = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: '🚗 Reservation Confirmation',
      html: htmlContent,
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendRentalInvoiceWithPdf({
    to,
    customerName,
    carModel,
    startDate,
    endDate,
    duration,
    rentalCost,
    totalCost,
    currency,
    invoiceNumber,
    paymentId,
    currentDate,
  }: RentalInvoiceData): Promise<SuccessMessage> {
    const htmlContent = this.rentalInvoiceTemplate
      .replace('{{customerName}}', customerName)
      .replace('{{carModel}}', carModel)
      .replace('{{startDate}}', startDate)
      .replace('{{endDate}}', endDate)
      .replace(/{{duration}}/g, duration)
      .replace('{{rentalCost}}', rentalCost)
      .replace('{{totalCost}}', totalCost)
      .replace(/{{currency}}/g, currency)
      .replace('{{invoiceNumber}}', invoiceNumber)
      .replace('{{paymentId}}', paymentId)
      .replace('{{currentDate}}', currentDate);

    const pdfBuffer = await this.generatePdfFromHtml(htmlContent);

    const mailOptions: nodemailer.SendMailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: to,
      subject: '🚗 Your Car Rental Invoice',
      text: rentalInvoiceEmailBody,
      attachments: [
        {
          filename: 'rental-invoice.pdf',
          content: pdfBuffer,
        },
      ],
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { message: 'Rental invoice email sent with PDF attachment' };
    } catch (error) {
      logError(error);
      throwCustomError(
        error?.error?.message,
        error?.error?.status,
        'Error sending rental invoice with PDF attachment:',
      );
    }
  }
}
