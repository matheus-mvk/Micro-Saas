import { Module } from '@nestjs/common';

import { ConfigurationModule } from '../../config/configuration.module';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditModule } from '../audit/audit.module';

import { AuthContextService } from './auth-context.service';
import { AuthCookieService } from './auth-cookie.service';
import { AuthLoginAttemptService } from './auth-login-attempt.service';
import { AuthTokenService } from './auth-token.service';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { EmailDeliveryService } from './email-delivery.service';
import { MfaService } from './mfa.service';
import { OAuthService } from './oauth.service';
import { PasswordService } from './password.service';

@Module({
  imports: [AuditModule, CacheModule, ConfigurationModule, DatabaseModule],
  controllers: [AuthController],
  providers: [
    AuthContextService,
    AuthCookieService,
    AuthLoginAttemptService,
    AuthRepository,
    AuthService,
    AuthTokenService,
    EmailDeliveryService,
    MfaService,
    OAuthService,
    PasswordService,
  ],
  exports: [AuthContextService, AuthCookieService, AuthRepository, AuthService, AuthTokenService, EmailDeliveryService, PasswordService],
})
export class AuthModule {}
