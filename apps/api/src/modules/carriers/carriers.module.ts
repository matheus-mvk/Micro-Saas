import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditModule } from '../audit/audit.module';

import { CarriersController } from './carriers.controller';
import { CarriersService } from './carriers.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [CarriersController],
  providers: [CarriersService],
  exports: [CarriersService],
})
export class CarriersModule {}
