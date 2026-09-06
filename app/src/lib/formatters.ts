import { toIntlLocale } from '@/lib/intlLocale';

export function formatAmount(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatDateTime(
  value: string | Date | null | undefined,
  locale: string,
  fallback = '—',
): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDate(
  value: string | Date | null | undefined,
  locale: string,
  fallback = '—',
): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(toIntlLocale(locale)).format(date);
}
