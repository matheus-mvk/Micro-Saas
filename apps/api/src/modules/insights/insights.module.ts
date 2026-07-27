import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditModule } from '../audit/audit.module';

import { CostInsightsGenerator } from './generators/cost-insights.generator';
import { PerformanceInsightsGenerator } from './generators/performance-insights.generator';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';

@Module({
  imports: [AuditModule, DatabaseModule],
  controllers: [InsightsController],
  providers: [CostInsightsGenerator, InsightsService, PerformanceInsightsGenerator],
  exports: [InsightsService],
})
export class InsightsModule {}
