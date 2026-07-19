import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { sanitizeLogPayload } from '../../common/utils/sanitize-log';
import { AppConfigService } from '../../config/app-config.service';
import { ConfigurationModule } from '../../config/configuration.module';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.logLevel,
          redact: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
            'req.body.password',
            'req.body.refreshToken',
            'req.body.accessToken',
            'req.body.totpSecret',
          ],
          customProps: (req) => {
            const request = req as typeof req & {
              context?: { requestId?: string; correlationId?: string; tenantId?: string };
            };
            return sanitizeLogPayload({
              requestId: request.context?.requestId,
              correlationId: request.context?.correlationId,
              tenantId: request.context?.tenantId,
            });
          },
        },
      }),
    }),
  ],
})
export class ObservabilityModule {}
