'use client';

import { useTranslations } from 'next-intl';
import { TbUser } from 'react-icons/tb';
import Placeholder from '@/components/Profile/Placeholder/Placeholder';

export default function AccountPage() {
  const t = useTranslations('account');
  return (
    <Placeholder
      icon={<TbUser />}
      title={t('pageTitle')}
      subtitle={t('pageSubtitle')}
    />
  );
}
