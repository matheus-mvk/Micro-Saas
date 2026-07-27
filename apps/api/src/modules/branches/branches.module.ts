import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditModule } from '../audit/audit.module';

import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
