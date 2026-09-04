export const CONTENT_LOCALES = ['en', 'am', 'ru'] as const;

export type ContentLocale = (typeof CONTENT_LOCALES)[number];
export type LocalizedText = Partial<Record<ContentLocale, string>>;

export function cleanLocalizedText(value?: LocalizedText): LocalizedText {
  const cleaned: LocalizedText = {};

  for (const locale of CONTENT_LOCALES) {
    const text = value?.[locale]?.trim();
    if (text) cleaned[locale] = text;
  }

  return cleaned;
}

export function missingContentLocales(value?: LocalizedText): ContentLocale[] {
  const cleaned = cleanLocalizedText(value);
  return CONTENT_LOCALES.filter((locale) => !cleaned[locale]);
}

export function hasLocalizedText(value?: LocalizedText): boolean {
  return CONTENT_LOCALES.some((locale) => Boolean(value?.[locale]?.trim()));
}

export function resolveLocalizedText(
  value: LocalizedText | undefined,
  fallback = '',
  requestedLocale?: string,
): string {
  const browserLocale =
    requestedLocale ??
    (typeof document !== 'undefined' ? document.documentElement.lang : 'en');
  const normalizedLocale = browserLocale.toLowerCase().startsWith('hy')
    ? 'am'
    : browserLocale.toLowerCase().split('-')[0];
  const locale = CONTENT_LOCALES.includes(normalizedLocale as ContentLocale)
    ? (normalizedLocale as ContentLocale)
    : 'en';
  const cleaned = cleanLocalizedText(value);

  return cleaned[locale] ?? cleaned.en ?? cleaned.am ?? cleaned.ru ?? fallback;
}
