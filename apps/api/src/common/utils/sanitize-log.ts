const SENSITIVE_KEYS = ['password', 'token', 'secret', 'cookie', 'authorization', 'totp'];

export function sanitizeLogPayload(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive)) ? '[REDACTED]' : entry,
    ]),
  );
}
