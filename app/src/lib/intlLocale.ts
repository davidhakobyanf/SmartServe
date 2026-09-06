const INTL_LOCALES: Record<string, string> = {
  am: 'hy-AM',
  hy: 'hy-AM',
  ru: 'ru-RU',
  en: 'en-US',
};

export function toIntlLocale(locale?: string): string {
  const language = locale?.trim().toLowerCase().split('-')[0] ?? 'en';
  return INTL_LOCALES[language] ?? locale ?? 'en-US';
}
