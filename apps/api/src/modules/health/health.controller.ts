import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';

import { Public } from '../../common/decorators/public.decorator';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthCheckService)
    private readonly health: HealthCheckService,
    @Inject(PrismaHealthIndicator)
    private readonly prismaHealth: PrismaHealthIndicator,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(RedisService)
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaHealth.pingCheck('mysql', this.prisma),
      async () => {
        const pong = await this.redis.ping();
        return { redis: { status: pong === 'PONG' ? 'up' : 'down' } };
      },
    ]);
  }

  @Public()
  @Get('live')
  live(): { status: 'ok'; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    return this.check();
  }
}
