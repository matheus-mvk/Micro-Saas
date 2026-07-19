import { Module } from '@nestjs/common';

import { QueueModule } from '../../infrastructure/queue/queue.module';

@Module({
  imports: [QueueModule],
})
export class ImportsModule {}
