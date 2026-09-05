'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Form as AntdForm } from 'antd';
import {
  TbChefHat,
  TbRefresh,
  TbToolsKitchen2,
  TbBell,
  TbTable,
} from 'react-icons/tb';
import css from './FormContainer.module.css';
import Registration from './Registration/Registration';
import Login from './Login/Login';
import LanguageSwitcher from '@/components/LanguageSwitcher/LanguageSwitcher';
import { useVenueSettings } from '@/context/VenueSettingsContext';

const FEATURES = [
  { icon: TbRefresh, key: 'realtimeOrders' },
  { icon: TbToolsKitchen2, key: 'menuManagement' },
  { icon: TbBell, key: 'waiterNotifications' },
  { icon: TbTable, key: 'multiTable' },
];

export default function FormContainer() {
  const t = useTranslations('auth');
  const [form] = AntdForm.useForm();
  const [check, setCheck] = useState(false);
  const { settings } = useVenueSettings();

  const handleCreate = () => {
    form.validateFields().catch(() => undefined);
  };

  return (
    <div className={css.page}>
      <div className={css.card}>
        <aside className={css.hero}>
          <div className={css.brand}>
            <span className={css.logo}>
              <TbChefHat />
            </span>
            <span className={css.brandName}>{settings.venueName}</span>
            <span className={css.langSwitcher}>
              <LanguageSwitcher />
            </span>
          </div>

          <div className={css.heroBody}>
            <h1 className={css.heroTitle}>{t('hero.title')}</h1>
            <p className={css.heroSub}>{t('hero.subtitle')}</p>

            <ul className={css.features}>
              {FEATURES.map(({ icon: Icon, key }) => (
                <li key={key} className={css.feature}>
                  <span className={css.featureIcon}>
                    <Icon />
                  </span>
                  {t(`hero.features.${key}`)}
                </li>
              ))}
            </ul>
          </div>

          <span className={css.blob1} />
          <span className={css.blob2} />
        </aside>

        <section className={css.formSide}>
          {check ? (
            <Registration form={form} setCheck={setCheck} />
          ) : (
            <Login
              form={form}
              handleCreate={handleCreate}
              check={check}
              setCheck={setCheck}
            />
          )}
        </section>
      </div>
    </div>
  );
}
