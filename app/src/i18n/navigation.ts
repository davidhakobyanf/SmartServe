import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware navigation wrappers. Use these instead of the equivalents from
// `next/navigation` / `next/link` so the active locale prefix is preserved.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
