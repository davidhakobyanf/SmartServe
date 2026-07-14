import { defineRouting } from 'next-intl/routing';

// 'am' is used as the URL/locale code for Armenian (per project preference).
export const locales = ['am', 'ru', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'am';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Always show the locale prefix in the URL: /am, /ru, /en
  localePrefix: 'always',
});
