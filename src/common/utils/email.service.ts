  import * as nodemailer from 'nodemailer';
  import { Injectable } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';

  @Injectable()
  export class EmailService {
    public transporter: nodemailer.Transporter;
    private  APP_EMAIL : string
    private APP_PASSWORD: string
    constructor(private readonly configService: ConfigService) {
      this.APP_EMAIL  = configService.get<string>('APP_EMAIL') as string
      this.APP_PASSWORD  = configService.get<string>('APP_PASSWORD') as string
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.APP_EMAIL,
          pass: this.APP_PASSWORD,
        },
      });
    }

    async sendEmail(to: string, subject: string, html: string) {
      try {
        await this.transporter.sendMail({
          from: `Hazem_Adel <${this.APP_EMAIL}>`,
          to,
          subject,
          html,
        });
      } catch (error) {
        console.error('Error sending email:', error);
      }
    }
  }


