import type { ApiErrorResponse } from '@logistics/shared';

import { publicEnv } from '@/lib/env';

export class ApiClientError extends Error {
  constructor(readonly response: ApiErrorResponse) {
    super(response.message);
  }
}

export async function apiRequest<TResponse>(
  path: string,
  init: RequestInit = {},
): Promise<TResponse> {
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');
  headers.set('content-type', 'application/json');

  const response = await fetch(`${publicEnv.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new ApiClientError(error);
  }

  return (await response.json()) as TResponse;
}
