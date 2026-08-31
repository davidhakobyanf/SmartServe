import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

// Every top-level namespace lives in its own file per locale:
//   src/messages/<locale>/<namespace>.json
// They are merged into a single messages object here.
const namespaces = [
  'common',
  'nav',
  'auth',
  'dashboard',
  'menu',
  'account',
  'settings',
  'tables',
  'placeholder',
  'orders',
  'waiter',
  'menuModal',
  'client',
  'staff',
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages: Record<string, unknown> = {};
  for (const ns of namespaces) {
    messages[ns] = (await import(`../messages/${locale}/${ns}.json`)).default;
  }

  return { locale, messages };
});
