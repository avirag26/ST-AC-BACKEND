import { Injectable, Logger } from '@nestjs/common';

export type WelcomeEmailPayload = {
  to: string;
  fullName: string;
  roleLabel: string;
  temporaryPassword: string;
};

/**
 * Dev stub — logs welcome mail. Real SMTP/provider comes later.
 * Callers must treat emailSent as false until SMTP is wired.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendWelcomeWithPassword(payload: WelcomeEmailPayload): Promise<{
    emailed: boolean;
    reason: string;
  }> {
    this.logger.log(
      `[welcome stub] to=${payload.to} role=${payload.roleLabel} name=${payload.fullName}`,
    );
    this.logger.debug(
      `Temporary password for ${payload.to}: ${payload.temporaryPassword}`,
    );

    return {
      emailed: false,
      reason:
        'Email delivery is not configured yet. Share the temporary password shown in the CEO portal.',
    };
  }
}
