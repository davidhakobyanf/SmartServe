'use client';

import { useTranslations } from 'next-intl';
import { TbTable } from 'react-icons/tb';
import Placeholder from '@/components/Profile/Placeholder/Placeholder';

export default function TablesPage() {
  const t = useTranslations('tables');
  return (
    <Placeholder
      icon={<TbTable />}
      title={t('pageTitle')}
      subtitle={t('pageSubtitle')}
    />
  );
}
