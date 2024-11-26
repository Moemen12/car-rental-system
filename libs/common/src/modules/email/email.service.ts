import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private registrationEmailTemplate: string;
  private ThankFullEmailTemplate: string;
  private resetPasswordTemplate: string;

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

    const templatesPath = path.resolve(
      process.cwd(),
      'libs/common/src/utilities/templates',
    );

    this.registrationEmailTemplate = fs.readFileSync(
      path.join(templatesPath, 'registration-email.html'),
      'utf8',
    );
    // this.resetPasswordTemplate = fs.readFileSync(
    //   'src/common/utilities/templates/reset_password.html',
    //   'utf8',
    // );
    // this.ThankFullEmailTemplate = fs.readFileSync(
    //   'src/common/utilities/templates/email_thanks.html',
    //   'utf8',
    // );
  }

  async sendRegistrationEmail(email: string, fullName: string) {
    const htmlContent = this.registrationEmailTemplate
      .replace('{{fullName}}', fullName)
      .replace('{{email}}', email);

    const mailOptions: Mail.Options = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: '🚗 Welcome to CarRental - Your Account is Ready!',
      html: htmlContent,
    };

    return await this.transporter.sendMail(mailOptions);
  }

  // async sendThankFullEmail(email: string, name: string) {
  //   const htmlContent = this.ThankFullEmailTemplate.replace(
  //     '{{name}}',
  //     name,
  //   ).replace('{{APP_URL}}', this.configService.get<string>('FRONTEND_URL'));

  //   const mailOptions: Mail.Options = {
  //     from: this.configService.get<string>('EMAIL_USER'),
  //     to: email,
  //     subject: 'Welcome to YallaMusic',
  //     html: htmlContent,
  //   };

  //   return await this.transporter.sendMail(mailOptions);
  // }

  // async resetPassEmail(email: string, uuid: string) {
  //   // http://localhost:3000/reset-password?token=
  //   const tokenUrl =
  //     this.configService.get<string>('FRONTEND_URL') +
  //     `auth/reset-password/token/${uuid}`;

  //   const htmlContent = this.resetPasswordTemplate
  //     .replace('{{tokenUrl}}', tokenUrl)
  //     .replace('{{APP_URL}}', this.configService.get<string>('FRONTEND_URL'));

  //   const mailOptions: Mail.Options = {
  //     from: this.configService.get<string>('EMAIL_USER'),
  //     to: email,
  //     subject: 'Welcome to YallaMusic',
  //     html: htmlContent,
  //   };

  //   return await this.transporter.sendMail(mailOptions);
  // }
}
