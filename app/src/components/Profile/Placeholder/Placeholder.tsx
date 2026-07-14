'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import css from './Placeholder.module.css';

interface PlaceholderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export default function Placeholder({ icon, title, subtitle }: PlaceholderProps) {
  const t = useTranslations('placeholder');
  return (
    <div className={css.wrap}>
      <div className={css.header}>
        <h1 className={css.title}>{title}</h1>
        <p className={css.subtitle}>{subtitle}</p>
      </div>
      <div className={css.card}>
        <span className={css.icon}>{icon}</span>
        <h2 className={css.cardTitle}>{t('comingSoon')}</h2>
        <p className={css.cardText}>{t('body')}</p>
      </div>
    </div>
  );
}
