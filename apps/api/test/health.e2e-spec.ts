import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import type { NextFunction, Response } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { RequestContextMiddleware } from '../src/common/middleware/request-context.middleware';
import type { RequestWithContext } from '../src/common/types/request-context';
import { RedisService } from '../src/infrastructure/cache/redis.service';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Health e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/db';
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);

    const { HealthModule } = await import('../src/modules/health/health.module');

    const moduleRef = await Test.createTestingModule({ imports: [HealthModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(RedisService)
      .useValue({ ping: async () => 'PONG' })
      .overrideProvider(PrismaHealthIndicator)
      .useValue({ pingCheck: async () => ({ mysql: { status: 'up' } }) })
      .overrideProvider(HealthCheckService)
      .useValue({
        check: async (checks: (() => Promise<Record<string, unknown>>)[]) => ({
          status: 'ok',
          info: Object.assign({}, ...(await Promise.all(checks.map((check) => check())))),
          error: {},
          details: {},
        }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    const requestContext = new RequestContextMiddleware();
    app.use((req: RequestWithContext, res: Response, next: NextFunction) => {
      requestContext.use(req, res, next);
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves liveness with request id', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health/live').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('serves readiness with MySQL and Redis checks', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);

    expect(response.body.info.mysql.status).toBe('up');
    expect(response.body.info.redis.status).toBe('up');
  });
});
