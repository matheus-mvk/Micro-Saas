import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AppConfigService } from '../../config/app-config.service';
import { ConfigurationModule } from '../../config/configuration.module';
import { buildRedisOptions } from '../cache/redis-options';

export const IMPORT_QUEUE = 'imports';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        connection: buildRedisOptions(config),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      }),
    }),
    BullModule.registerQueue({ name: IMPORT_QUEUE }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
