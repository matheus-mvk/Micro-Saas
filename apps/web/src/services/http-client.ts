import type { ApiErrorResponse } from '@logistics/shared';

import { publicEnv } from '@/lib/env';

export class ApiClientError extends Error {
  constructor(readonly response: ApiErrorResponse) {
    super(response.message);
  }
}

export class ApiConnectionError extends Error {
  constructor(readonly originalError: unknown) {
    super('Unable to reach the API.');
  }
}

export async function apiRequest<TResponse>(
  path: string,
  init: RequestInit = {},
): Promise<TResponse> {
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');

  if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  let response: Response;
  const { signal, timeoutId } = createRequestSignal(init.signal);

  try {
    response = await fetch(`${publicEnv.NEXT_PUBLIC_API_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      signal,
    });
  } catch (error) {
    throw new ApiConnectionError(error);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const error = await readErrorResponse(response);
    throw new ApiClientError(error);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as TResponse;
}

function createRequestSignal(externalSignal: AbortSignal | null | undefined): { signal: AbortSignal; timeoutId: ReturnType<typeof setTimeout> } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException('API request timed out.', 'TimeoutError'));
  }, publicEnv.NEXT_PUBLIC_API_TIMEOUT_MS);

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener(
        'abort',
        () => {
          controller.abort(externalSignal.reason);
        },
        { once: true },
      );
    }
  }

  return { signal: controller.signal, timeoutId };
}

async function readErrorResponse(response: Response): Promise<ApiErrorResponse> {
  try {
    return (await response.json()) as ApiErrorResponse;
  } catch {
    return {
      statusCode: response.status,
      code: response.status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
      message: response.status === 401 ? 'Authentication is required.' : 'Unexpected server error.',
      details: [],
      requestId: 'unavailable',
      timestamp: new Date().toISOString(),
      path: response.url,
    };
  }
}
