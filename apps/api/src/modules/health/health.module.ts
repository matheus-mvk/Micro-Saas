import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';

import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, DatabaseModule, CacheModule],
  controllers: [HealthController],
})
export class HealthModule {}
