import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';

import {
  EmailConfirmationData,
  EmailRegistrationData,
  RentalInvoiceData,
  SuccessMessage,
} from '@app/common/types';
import { EmailServiceService } from './email-service.service';

@Controller()
export class EmailServiceController {
  constructor(private readonly emailServiceService: EmailServiceService) {}

  @EventPattern({ cmd: 'send-email' })
  async sendRegistrationEmail({ email, fullName }: EmailRegistrationData) {
    console.log('i listened');

    return await this.emailServiceService.sendRegistrationEmail(
      email,
      fullName,
    );
  }

  @MessagePattern({ cmd: 'payment-confirmation-email' })
  async sendPaymentConfirmation(emailConfirmationData: EmailConfirmationData) {
    return await this.emailServiceService.sendPaymentConfirmation(
      emailConfirmationData,
    );
  }

  @MessagePattern({ cmd: 'send-invoice-email' })
  async sendInvoicePdf(
    invoiceData: RentalInvoiceData,
  ): Promise<SuccessMessage> {
    return await this.emailServiceService.sendRentalInvoiceWithPdf(invoiceData);
  }
}
