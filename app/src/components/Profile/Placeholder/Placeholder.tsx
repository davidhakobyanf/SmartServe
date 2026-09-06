'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import css from './Placeholder.module.css';
import PageHeader from '@/components/Common/PageHeader/PageHeader';
import Typography from '@/components/Common/Typography/Typography';

interface PlaceholderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export default function Placeholder({ icon, title, subtitle }: PlaceholderProps) {
  const t = useTranslations('placeholder');
  return (
    <div className={css.wrap}>
      <PageHeader title={title} subtitle={subtitle} />
      <div className={css.card}>
        <span className={css.icon}>{icon}</span>
        <Typography as="h2" variant="sectionTitle" className={css.cardTitle}>{t('comingSoon')}</Typography>
        <Typography variant="bodyMuted" className={css.cardText}>{t('body')}</Typography>
      </div>
    </div>
  );
}
