'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { TbToolsKitchen2, TbArrowRight } from 'react-icons/tb';
import css from './ClientTable.module.css';

export default function ClientTable() {
  const t = useTranslations('client');
  const router = useRouter();

  const handleNavigateToClient = (clientId: number) => {
    router.push(`/client/${clientId}`);
  };

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

      <div className={css.grid}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((clientId) => (
          <button
            key={clientId}
            type="button"
            className={css.tile}
            onClick={() => handleNavigateToClient(clientId)}
          >
            <span className={css.tileNum}>{clientId}</span>
            <span className={css.tileLabel}>
              {t('table.tableLabel', { number: clientId })} <TbArrowRight />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
