import { Injectable, Logger } from '@nestjs/common';

import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class EmailDeliveryService {
  private readonly logger = new Logger(EmailDeliveryService.name);

  constructor(private readonly config: AppConfigService) {}

  async sendPasswordReset(input: { email: string; resetUrl: string }): Promise<{ devUrl?: string }> {
    if (this.config.nodeEnv !== 'production') {
      this.logger.log({ email: input.email, resetUrl: input.resetUrl }, 'Development password reset link generated.');
      return { devUrl: input.resetUrl };
    }

    this.logger.warn('Password reset requested but no production e-mail provider is configured.');
    return {};
  }

  async sendInvitation(input: { email: string; inviteUrl: string }): Promise<{ devUrl?: string }> {
    if (this.config.nodeEnv !== 'production') {
      this.logger.log({ email: input.email, inviteUrl: input.inviteUrl }, 'Development invitation link generated.');
      return { devUrl: input.inviteUrl };
    }

    this.logger.warn('User invitation requested but no production e-mail provider is configured.');
    return {};
  }
}
