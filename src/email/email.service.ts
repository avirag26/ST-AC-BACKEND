import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
export type WelcomeEmailPayload = { to: string; fullName: string; roleLabel: string; temporaryPassword: string };
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(private readonly config: ConfigService) {}
  get configured() { return Boolean(this.config.get('SMTP_HOST') && this.config.get('SMTP_FROM')); }
  async send(to: string, subject: string, text: string) {
    if (!this.configured) throw new ServiceUnavailableException('Email delivery is not configured. Contact the academy.');
    const user = this.config.get<string>('SMTP_USER');
    const transport = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'), port: Number(this.config.get('SMTP_PORT', '587')),
      secure: this.config.get('SMTP_SECURE', 'false') === 'true',
      requireTLS: this.config.get('SMTP_SECURE', 'false') !== 'true',
      auth: user ? { user, pass: this.config.get<string>('SMTP_PASSWORD') } : undefined,
      connectionTimeout: 10000, socketTimeout: 15000, disableFileAccess: true, disableUrlAccess: true,
    });
    try {
      const result = await transport.sendMail({ from: this.config.get<string>('SMTP_FROM'), to, subject, text });
      if (!result.accepted.length) throw new Error('Recipient not accepted');
    } catch {
      this.logger.warn('Email delivery failed; check SMTP configuration.');
      throw new ServiceUnavailableException('Email could not be sent. Please try again later.');
    } finally { transport.close(); }
  }
  async sendWelcomeWithPassword(payload: WelcomeEmailPayload): Promise<{ emailed: boolean; reason: string }> {
    try {
      await this.send(payload.to, 'Welcome to Straight Line Academy',
        `Hello ${payload.fullName},\nYour ${payload.roleLabel} account is ready.\nEmail: ${payload.to}\nTemporary password: ${payload.temporaryPassword}\nPlease change your password after signing in.`);
      return { emailed: true, reason: 'Welcome email accepted by the mail server.' };
    } catch {
      return { emailed: false, reason: 'Email could not be delivered. Share the temporary password shown in the CEO portal securely.' };
    }
  }
}
