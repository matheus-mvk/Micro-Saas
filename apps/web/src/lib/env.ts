import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_TIMEOUT_MS: z.coerce.number().int().positive().default(90000),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3333/api/v1'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_API_TIMEOUT_MS: process.env.NEXT_PUBLIC_API_TIMEOUT_MS,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});
