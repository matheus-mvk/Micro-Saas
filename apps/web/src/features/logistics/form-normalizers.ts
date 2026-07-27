export function cleanText(value: string | null | undefined): string {
  return (value ?? '').trim();
}

export function cleanOptionalText(value: string | null | undefined): string | undefined {
  const normalized = cleanText(value);
  return normalized.length > 0 ? normalized : undefined;
}

export function cleanCode(value: string): string {
  return cleanText(value).toUpperCase().replace(/[^\dA-Z_-]/g, '');
}

export function cleanDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

export function cleanState(value: string): string {
  return cleanText(value).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
}

export function parseLocaleNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const raw = cleanText(value);
  if (!raw) return 0;
  const normalized = raw
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parsePercent(value: string | number | null | undefined): number {
  const parsed = parseLocaleNumber(value);
  return cleanText(String(value ?? '')).includes('%') ? parsed / 100 : parsed;
}

export function isValidEmail(value: string | null | undefined): boolean {
  const normalized = cleanText(value);
  return normalized.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function isValidUrl(value: string | null | undefined): boolean {
  const normalized = cleanText(value);
  if (!normalized) return true;
  try {
    const url = new URL(normalized);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
