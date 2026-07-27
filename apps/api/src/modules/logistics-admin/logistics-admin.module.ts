import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { RealtimeModule } from '../../infrastructure/realtime/realtime.module';
import { AuditModule } from '../audit/audit.module';
import { LogisticsAdminController } from './logistics-admin.controller';
import { LogisticsAdminService } from './logistics-admin.service';

@Module({ imports: [DatabaseModule, AuditModule, RealtimeModule], controllers: [LogisticsAdminController], providers: [LogisticsAdminService] })
export class LogisticsAdminModule {}
