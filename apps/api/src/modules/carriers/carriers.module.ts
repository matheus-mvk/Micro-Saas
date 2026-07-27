import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { ConfigurationModule } from '../../config/configuration.module';
import { AuditModule } from '../audit/audit.module';

import { CarrierImageStorageService } from './carrier-image-storage.service';
import { CarriersController } from './carriers.controller';
import { CarriersService } from './carriers.service';

@Module({
  imports: [ConfigurationModule, DatabaseModule, AuditModule],
  controllers: [CarriersController],
  providers: [CarrierImageStorageService, CarriersService],
  exports: [CarriersService],
})
export class CarriersModule {}
