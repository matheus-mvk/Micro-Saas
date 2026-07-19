import { Module } from '@nestjs/common';

import { RealtimeModule } from '../../infrastructure/realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
})
export class NotificationsModule {}
