import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { RealtimeModule } from '../../infrastructure/realtime/realtime.module';
import { AuditModule } from '../audit/audit.module';

import { FreightSimulationsController } from './freight-simulations.controller';
import { FreightSimulationsService } from './freight-simulations.service';
import { FreightPricingEngine } from './pricing/freight-pricing.engine';

@Module({
  imports: [AuditModule, DatabaseModule, RealtimeModule],
  controllers: [FreightSimulationsController],
  providers: [FreightPricingEngine, FreightSimulationsService],
  exports: [FreightSimulationsService],
})
export class FreightSimulationsModule {}
