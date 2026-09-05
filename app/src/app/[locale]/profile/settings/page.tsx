'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { App, Button, Form, Input, Select } from 'antd';
import { TbBuildingStore, TbDeviceFloppy } from 'react-icons/tb';
import { useVenueSettings } from '@/context/VenueSettingsContext';
import type { VenueSettingsRecord } from '@/types/restaurant';
import css from './SettingsPage.module.css';

type SettingsFormValues = Pick<
  VenueSettingsRecord,
  'venueName' | 'currency' | 'timezone'
>;

const CURRENCIES = ['AMD', 'USD', 'EUR', 'RUB'];

const TIMEZONES = [
  'Asia/Yerevan',
  'Europe/Moscow',
  'Europe/Paris',
  'America/New_York',
  'UTC',
];

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { message } = App.useApp();
  const [form] = Form.useForm<SettingsFormValues>();
  const [isSaving, setIsSaving] = useState(false);
  const { settings, refreshSettings, updateSettings } = useVenueSettings();

  useEffect(() => {
    void refreshSettings(true).catch(() => message.error(t('loadError')));
  }, [message, refreshSettings, t]);

  useEffect(() => {
    form.setFieldsValue({
      venueName: settings.venueName,
      currency: settings.currency,
      timezone: settings.timezone,
    });
  }, [form, settings]);

  const handleSave = async (values: SettingsFormValues) => {
    try {
      setIsSaving(true);
      await updateSettings(values);
      message.success(t('saveSuccess'));
    } catch {
      message.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={css.wrap}>
      <header>
        <h1 className={css.title}>{t('pageTitle')}</h1>
        <p className={css.subtitle}>{t('pageSubtitle')}</p>
      </header>

      <section className={css.card}>
        <div className={css.cardHeader}>
          <span className={css.icon}><TbBuildingStore /></span>
          <div>
            <h2>{t('restaurantTitle')}</h2>
            <p>{t('restaurantSubtitle')}</p>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className={css.form}
          onFinish={handleSave}
        >
          <Form.Item
            name="venueName"
            label={t('venueName.label')}
            rules={[
              { required: true, whitespace: true, message: t('venueName.required') },
              { max: 160, message: t('venueName.maxLength') },
            ]}
          >
            <Input placeholder={t('venueName.placeholder')} />
          </Form.Item>

          <div className={css.grid}>
            <Form.Item
              name="currency"
              label={t('currency.label')}
              rules={[{ required: true, message: t('currency.required') }]}
            >
              <Select
                options={CURRENCIES.map((currency) => ({
                  label: currency,
                  value: currency,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="timezone"
              label={t('timezone.label')}
              rules={[{ required: true, message: t('timezone.required') }]}
            >
              <Select
                showSearch
                options={TIMEZONES.map((timezone) => ({
                  label: timezone,
                  value: timezone,
                }))}
              />
            </Form.Item>
          </div>

          <div className={css.actions}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<TbDeviceFloppy />}
              loading={isSaving}
            >
              {t('save')}
            </Button>
          </div>
        </Form>
      </section>
    </div>
  );
}
