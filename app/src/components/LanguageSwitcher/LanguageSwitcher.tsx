'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Select } from 'antd';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n/routing';
import { LanguageIcon } from '@/components/Common/InterfaceIcons';
import css from './LanguageSwitcher.module.css';

export default function LanguageSwitcher({
  size = 'middle',
}: {
  size?: 'small' | 'middle' | 'large';
}) {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  const onChange = (next: Locale) => {
    startTransition(() => {
      // Keep the current pathname and route params, only swap the locale.
      router.replace(
        // @ts-expect-error -- pathname is a valid known route
        { pathname, params },
        { locale: next },
      );
    });
  };

  return (
    <Select<Locale>
      className={css.switcher}
      size={size}
      value={locale}
      onChange={onChange}
      loading={isPending}
      variant="borderless"
      suffixIcon={<LanguageIcon />}
      popupMatchSelectWidth={false}
      options={locales.map((l) => ({
        value: l,
        label: t(`lang_${l}`),
      }))}
    />
  );
}
