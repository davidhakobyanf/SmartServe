'use client';

import { useTranslations } from 'next-intl';
import { TbLayoutDashboard } from 'react-icons/tb';
import Placeholder from '@/components/Profile/Placeholder/Placeholder';

export default function ProfileDashboardPage() {
  const t = useTranslations('dashboard');
  return (
    <Placeholder
      icon={<TbLayoutDashboard />}
      title={t('pageTitle')}
      subtitle={t('pageSubtitle')}
    />
  );
}
