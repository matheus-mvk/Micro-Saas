import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().optional(),
  API_PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  AUTH_LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  AUTH_LOGIN_WINDOW_SECONDS: z.coerce.number().int().positive().default(900),
  COOKIE_DOMAIN: z.string().default('localhost'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:3333/api/v1'),
  WEB_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  TOTP_ISSUER: z.string().default('LogisticsSaaS'),
  ADDRESS_LOOKUP_PROVIDER: z.enum(['viacep', 'brasilapi']).default('viacep'),
  OPENROUTE_API_KEY: z.string().optional(),
  ROUTE_DISTANCE_PROVIDER: z.enum(['openroute', 'fallback']).default('fallback'),
  LOGISTICS_INTEGRATION_TIMEOUT_MS: z.coerce.number().int().positive().default(2500),
  IMPORT_STORAGE_DIR: z.string().min(1).default('/tmp/nexora-freight-imports'),
  IMAGE_STORAGE_DIR: z.string().min(1).default('/tmp/nexora-freight-images'),
  IMPORT_MAX_FILE_SIZE_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  IMPORT_MAX_ROWS: z.coerce.number().int().positive().default(5000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(config: Record<string, unknown>): Environment {
  const parsed = environmentSchema.safeParse(config);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid environment configuration: ${issues.join('; ')}`);
  }

  return parsed.data;
}
