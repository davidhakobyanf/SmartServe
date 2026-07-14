'use client';

import { useTranslations } from 'next-intl';
import { TbSettings } from 'react-icons/tb';
import Placeholder from '@/components/Profile/Placeholder/Placeholder';

export default function SettingsPage() {
  const t = useTranslations('settings');
  return (
    <Placeholder
      icon={<TbSettings />}
      title={t('pageTitle')}
      subtitle={t('pageSubtitle')}
    />
  );
}
