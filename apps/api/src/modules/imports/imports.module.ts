import { Module } from '@nestjs/common';

import { ConfigurationModule } from '../../config/configuration.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { QueueModule } from '../../infrastructure/queue/queue.module';
import { RealtimeModule } from '../../infrastructure/realtime/realtime.module';
import { AuditModule } from '../audit/audit.module';

import { CarrierImportHandler } from './handlers/carrier-import.handler';
import { CustomerImportHandler } from './handlers/customer-import.handler';
import { ImportHandlerRegistry } from './handlers/import-handler-registry.service';
import { ImportsController } from './imports.controller';
import { ImportsProcessor } from './imports.processor';
import { ImportsService } from './imports.service';
import { ImportParser } from './parsing/import-parser';
import { ImportFileStorageService } from './storage/import-file-storage.service';

@Module({
  imports: [AuditModule, ConfigurationModule, DatabaseModule, QueueModule, RealtimeModule],
  controllers: [ImportsController],
  providers: [
    CarrierImportHandler,
    CustomerImportHandler,
    ImportFileStorageService,
    ImportHandlerRegistry,
    ImportParser,
    ImportsProcessor,
    ImportsService,
  ],
})
export class ImportsModule {}
