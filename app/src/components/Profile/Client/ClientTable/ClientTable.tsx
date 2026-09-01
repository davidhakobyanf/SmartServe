'use client';

import { useTranslations } from 'next-intl';
import { TbToolsKitchen2, TbQrcode } from 'react-icons/tb';
import css from './ClientTable.module.css';

export default function ClientTable() {
  const t = useTranslations('client');

  return (
    <div className={css.page}>
      <div className={css.brand}>
        <span className={css.logo}>
          <TbToolsKitchen2 />
        </span>
        <div>
          <h1 className={css.title}>SmartServe</h1>
          <p className={css.subtitle}>{t('table.subtitle')}</p>
        </div>
      </div>

      <div className={css.scanCard}>
        <span className={css.scanIcon}><TbQrcode /></span>
        <h2>{t('table.scanTitle')}</h2>
        <p>{t('table.scanMessage')}</p>
      </div>
    </div>
  );
}
