import { Module } from '@nestjs/common';

import { ConfigurationModule } from '../../config/configuration.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuditModule, AuthModule, ConfigurationModule, DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
