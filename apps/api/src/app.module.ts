import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrivateByDefaultGuard } from './common/guards/private-by-default.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { ConfigurationModule } from './config/configuration.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { ObservabilityModule } from './infrastructure/observability/observability.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { RealtimeModule } from './infrastructure/realtime/realtime.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CarriersModule } from './modules/carriers/carriers.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FreightSimulationsModule } from './modules/freight-simulations/freight-simulations.module';
import { HealthModule } from './modules/health/health.module';
import { ImportsModule } from './modules/imports/imports.module';
import { InsightsModule } from './modules/insights/insights.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LogisticsAdminModule } from './modules/logistics-admin/logistics-admin.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigurationModule,
    ObservabilityModule,
    DatabaseModule,
    CacheModule,
    QueueModule,
    RealtimeModule,
    HealthModule,
    AuthModule,
    TenantsModule,
    BranchesModule,
    UsersModule,
    CustomersModule,
    CarriersModule,
    FreightSimulationsModule,
    ImportsModule,
    DashboardModule,
    InsightsModule,
    AuditModule,
    NotificationsModule,
    LogisticsAdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: PrivateByDefaultGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
